"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  applications,
  applicationStageHistory,
  prospects,
} from "@/lib/db/schema";
import type { ApplicationStage } from "@/lib/db/schema";
import {
  getProspectByUserId,
} from "@/lib/queries/applications";
import {
  applicationReviewSchema,
  applyToPropertySchema,
  prospectProfileSchema,
} from "@/lib/validations/application";
import { parseMXNToCents } from "@/lib/utils/format";

export type ApplicationActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

async function requireProspect() {
  const session = await auth();
  if (!session?.user || session.user.role !== "prospect") {
    throw new Error("Forbidden");
  }
  return session;
}

async function requireLandlord() {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    throw new Error("Forbidden");
  }
  return session;
}

async function recordStageChange(
  applicationId: string,
  fromStage: ApplicationStage | null,
  toStage: ApplicationStage,
  changedById: string,
  notes?: string
) {
  await db.insert(applicationStageHistory).values({
    applicationId,
    fromStage,
    toStage,
    changedById,
    notes,
  });
}

export async function saveProspectProfile(
  _prev: ApplicationActionState,
  formData: FormData
): Promise<ApplicationActionState> {
  const session = await requireProspect();
  const parsed = prospectProfileSchema.safeParse({
    income: formData.get("income"),
    employer: formData.get("employer"),
    position: formData.get("position"),
    yearsEmployed: formData.get("yearsEmployed"),
    previousRentals: formData.get("previousRentals") || undefined,
    references: formData.get("references") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const prospect = await getProspectByUserId(session.user.id);
  if (!prospect) return { error: "Prospect profile not found." };

  await db
    .update(prospects)
    .set({
      income: parseMXNToCents(data.income),
      employment: JSON.stringify({
        employer: data.employer,
        position: data.position,
        yearsEmployed: Number(data.yearsEmployed),
      }),
      previousRentals: data.previousRentals?.trim() || null,
      references: data.references?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(prospects.id, prospect.id));

  revalidatePath("/portal/application");
  return { success: "Profile saved successfully." };
}

export async function applyToProperty(
  _prev: ApplicationActionState,
  formData: FormData
): Promise<ApplicationActionState> {
  const session = await requireProspect();
  const parsed = applyToPropertySchema.safeParse({
    propertyId: formData.get("propertyId"),
  });

  if (!parsed.success) {
    return { error: "Please select a property." };
  }

  const prospect = await getProspectByUserId(session.user.id);
  if (!prospect) return { error: "Prospect profile not found." };

  if (!prospect.income) {
    return {
      error: "Complete your profile (income & employment) before applying.",
    };
  }

  const [existing] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.prospectId, prospect.id),
        eq(applications.propertyId, parsed.data.propertyId)
      )
    )
    .limit(1);

  if (existing) {
    return { error: "You already have an application for this property." };
  }

  const [app] = await db
    .insert(applications)
    .values({
      prospectId: prospect.id,
      propertyId: parsed.data.propertyId,
      stage: "applied",
      submittedAt: new Date(),
    })
    .returning({ id: applications.id, stage: applications.stage });

  if (app) {
    await recordStageChange(app.id, "new", "applied", session.user.id);
  }

  revalidatePath("/portal/application");
  revalidatePath("/landlord/prospects");
  return { success: "Application submitted successfully." };
}

export async function updateApplicationReview(
  applicationId: string,
  _prev: ApplicationActionState,
  formData: FormData
): Promise<ApplicationActionState> {
  const session = await requireLandlord();
  const parsed = applicationReviewSchema.safeParse({
    stage: formData.get("stage"),
    rating: formData.get("rating") || undefined,
    landlordNotes: formData.get("landlordNotes") || undefined,
    assignedAgentId: formData.get("assignedAgentId") || undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid review data." };
  }

  const [current] = await db
    .select({ stage: applications.stage })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!current) return { error: "Application not found." };

  const data = parsed.data;
  const newStage = data.stage as ApplicationStage;

  await db
    .update(applications)
    .set({
      stage: newStage,
      rating: data.rating ? Number(data.rating) : null,
      landlordNotes: data.landlordNotes?.trim() || null,
      assignedAgentId: data.assignedAgentId || null,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId));

  if (current.stage !== newStage) {
    await recordStageChange(
      applicationId,
      current.stage,
      newStage,
      session.user.id,
      data.landlordNotes?.trim()
    );
  }

  revalidatePath("/landlord/prospects");
  revalidatePath(`/landlord/prospects/${applicationId}`);
  return { success: "Application updated." };
}

export async function updateApplicationStage(
  applicationId: string,
  stage: ApplicationStage
) {
  const session = await requireLandlord();
  const formData = new FormData();
  formData.set("stage", stage);
  await updateApplicationReview(applicationId, {}, formData);
}
