"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { db } from "@/lib/db";
import {
  applicationStageHistory,
  applications,
  showings,
} from "@/lib/db/schema";
import type { ApplicationStage, ShowingStatus } from "@/lib/db/schema";
import {
  findApplicationForShowing,
} from "@/lib/queries/showings";
import {
  requestShowingSchema,
  scheduleShowingSchema,
  showingOutcomeSchema,
} from "@/lib/validations/showing";
import { notifyLandlordShowingRequest } from "@/lib/email/notifications";
import { getProspectByUserId } from "@/lib/queries/applications";

export type ShowingActionState = {
  error?: string;
  success?: string;
};

async function requireLandlord() {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    throw new Error("Forbidden");
  }
  return session;
}

async function requireAgent() {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") {
    throw new Error("Forbidden");
  }
  const profile = await getAgentProfileByUserId(session.user.id);
  if (!profile?.isActive) throw new Error("Forbidden");
  return { session, profile };
}

async function advanceApplicationOnCompletedShowing(
  applicationId: string | null,
  prospectId: string,
  propertyId: string,
  changedById: string
) {
  let appId = applicationId;
  let currentStage: ApplicationStage | null = null;

  if (appId) {
    const [app] = await db
      .select({ stage: applications.stage })
      .from(applications)
      .where(eq(applications.id, appId))
      .limit(1);
    currentStage = app?.stage ?? null;
  } else {
    const app = await findApplicationForShowing(prospectId, propertyId);
    if (app) {
      appId = app.id;
      currentStage = app.stage;
    }
  }

  if (!appId || !currentStage) return;

  if (currentStage === "new") {
    await db
      .update(applications)
      .set({ stage: "property_viewed", updatedAt: new Date() })
      .where(eq(applications.id, appId));

    await db.insert(applicationStageHistory).values({
      applicationId: appId,
      fromStage: "new",
      toStage: "property_viewed",
      changedById,
      notes: "Property viewed — showing completed",
    });
  }
}

export async function scheduleShowing(
  _prev: ShowingActionState,
  formData: FormData
): Promise<ShowingActionState> {
  await requireLandlord();

  const parsed = scheduleShowingSchema.safeParse({
    propertyId: formData.get("propertyId"),
    prospectId: formData.get("prospectId"),
    agentId: formData.get("agentId"),
    scheduledAt: formData.get("scheduledAt"),
    durationMinutes: formData.get("durationMinutes") || "30",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please fill in all required fields." };
  }

  const data = parsed.data;
  const scheduledAt = new Date(data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { error: "Invalid date/time." };
  }

  const app = await findApplicationForShowing(data.prospectId, data.propertyId);

  await db.insert(showings).values({
    propertyId: data.propertyId,
    prospectId: data.prospectId,
    agentId: data.agentId,
    applicationId: app?.id ?? null,
    scheduledAt,
    durationMinutes: Number(data.durationMinutes) || 30,
    outcomeNotes: data.notes?.trim() || null,
    status: "scheduled",
  });

  revalidatePath("/landlord/showings");
  revalidatePath("/agent/showings");
  return { success: "Showing scheduled." };
}

export async function requestShowing(
  _prev: ShowingActionState,
  formData: FormData
): Promise<ShowingActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "prospect") {
    return { error: "Only prospects can request showings." };
  }

  const parsed = requestShowingSchema.safeParse({
    propertyId: formData.get("propertyId"),
    agentId: formData.get("agentId"),
    scheduledAt: formData.get("scheduledAt"),
    durationMinutes: formData.get("durationMinutes") || "30",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please fill in all required fields." };
  }

  const prospect = await getProspectByUserId(session.user.id);
  if (!prospect) return { error: "Prospect profile not found." };

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { error: "Invalid date/time." };
  }

  if (scheduledAt.getTime() < Date.now()) {
    return { error: "Please choose a future date and time." };
  }

  const app = await findApplicationForShowing(prospect.id, parsed.data.propertyId);

  const [showing] = await db
    .insert(showings)
    .values({
      propertyId: parsed.data.propertyId,
      prospectId: prospect.id,
      agentId: parsed.data.agentId,
      applicationId: app?.id ?? null,
      scheduledAt,
      durationMinutes: Number(parsed.data.durationMinutes) || 30,
      outcomeNotes: parsed.data.notes?.trim() || null,
      status: "requested",
    })
    .returning({ id: showings.id });

  if (showing) {
    try {
      await notifyLandlordShowingRequest({ showingId: showing.id });
    } catch (err) {
      console.error("[showing request email]", err);
    }
  }

  revalidatePath("/portal/properties");
  revalidatePath("/portal/application");
  revalidatePath("/landlord/showings");
  return {
    success: "Showing request submitted. Your landlord will confirm the appointment.",
  };
}

export async function confirmShowingRequest(
  showingId: string
): Promise<ShowingActionState> {
  await requireLandlord();

  const [showing] = await db
    .select({ status: showings.status })
    .from(showings)
    .where(eq(showings.id, showingId))
    .limit(1);

  if (!showing) return { error: "Showing not found." };
  if (showing.status !== "requested") {
    return { error: "Only requested showings can be confirmed." };
  }

  await db
    .update(showings)
    .set({ status: "scheduled", updatedAt: new Date() })
    .where(eq(showings.id, showingId));

  revalidatePath("/landlord/showings");
  revalidatePath("/agent/showings");
  revalidatePath("/portal/application");
  return { success: "Showing confirmed." };
}

export async function declineShowingRequest(
  showingId: string
): Promise<ShowingActionState> {
  await requireLandlord();

  await db
    .update(showings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(showings.id, showingId));

  revalidatePath("/landlord/showings");
  revalidatePath("/agent/showings");
  revalidatePath("/portal/application");
  return { success: "Showing request declined." };
}

export async function updateShowingOutcome(
  showingId: string,
  _prev: ShowingActionState,
  formData: FormData
): Promise<ShowingActionState> {
  const parsed = showingOutcomeSchema.safeParse({
    status: formData.get("status"),
    outcomeNotes: formData.get("outcomeNotes") || undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid outcome data." };
  }

  const session = await auth();
  if (!session?.user) return { error: "Unauthorized." };

  const [showing] = await db
    .select()
    .from(showings)
    .where(eq(showings.id, showingId))
    .limit(1);

  if (!showing) return { error: "Showing not found." };

  if (session.user.role === "agent") {
    const profile = await getAgentProfileByUserId(session.user.id);
    if (!profile || showing.agentId !== profile.id) {
      return { error: "Forbidden." };
    }
  } else if (session.user.role !== "landlord") {
    return { error: "Forbidden." };
  }

  const status = parsed.data.status as ShowingStatus;

  await db
    .update(showings)
    .set({
      status,
      outcomeNotes: parsed.data.outcomeNotes?.trim() || showing.outcomeNotes,
      updatedAt: new Date(),
    })
    .where(eq(showings.id, showingId));

  if (status === "completed") {
    await advanceApplicationOnCompletedShowing(
      showing.applicationId,
      showing.prospectId,
      showing.propertyId,
      session.user.id
    );
  }

  revalidatePath("/landlord/showings");
  revalidatePath("/agent/showings");
  revalidatePath("/landlord/prospects");
  return { success: "Showing updated." };
}

export async function cancelShowing(showingId: string) {
  await requireLandlord();
  await db
    .update(showings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(showings.id, showingId));
  revalidatePath("/landlord/showings");
  revalidatePath("/agent/showings");
}
