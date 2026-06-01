"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  notifyLandlordNewApplication,
  notifyProspectStageChange,
} from "@/lib/email/notifications";
import { db } from "@/lib/db";
import {
  applications,
  applicationStageHistory,
  prospects,
  properties,
  users,
} from "@/lib/db/schema";
import type { ApplicationStage } from "@/lib/db/schema";
import {
  getProspectByUserId,
} from "@/lib/queries/applications";
import { getDocumentsForEntity } from "@/lib/queries/documents";
import { recordStageChangeInternal } from "@/lib/actions/application-stage";
import { hasRequiredScreeningDocuments } from "@/lib/utils/screening-documents";
import {
  applicationReviewSchema,
  applyToPropertySchema,
  prospectProfileSchema,
  AGENT_APPLICATION_STAGES,
} from "@/lib/validations/application";
import { parseMXNToCents } from "@/lib/utils/format";
import { isProspectProfileComplete } from "@/lib/utils/prospect-profile";

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
  await recordStageChangeInternal(
    applicationId,
    fromStage,
    toStage,
    changedById,
    notes
  );
}

export async function saveProspectProfile(
  _prev: ApplicationActionState,
  formData: FormData
): Promise<ApplicationActionState> {
  const session = await requireProspect();
  const parsed = prospectProfileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    currentAddress: formData.get("currentAddress"),
    occupants: formData.get("occupants"),
    pets: formData.get("pets") || undefined,
    income: formData.get("income"),
    employer: formData.get("employer"),
    position: formData.get("position"),
    yearsEmployed: formData.get("yearsEmployed"),
    previousRentals: formData.get("previousRentals"),
    references: formData.get("references"),
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

  const occupants = parseInt(data.occupants, 10);
  if (Number.isNaN(occupants) || occupants < 1) {
    return { error: "Number of occupants must be at least 1." };
  }

  const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

  await db
    .update(users)
    .set({
      name: fullName,
      phone: data.phone.trim(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  await db
    .update(prospects)
    .set({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      currentAddress: data.currentAddress.trim(),
      occupants,
      pets: data.pets?.trim() || null,
      income: parseMXNToCents(data.income),
      employment: JSON.stringify({
        employer: data.employer,
        position: data.position,
        yearsEmployed: Number(data.yearsEmployed),
      }),
      previousRentals: data.previousRentals.trim(),
      references: data.references.trim(),
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

  const [user] = await db
    .select({ phone: users.phone })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!isProspectProfileComplete(prospect, user)) {
    return {
      error: "Complete your rental application profile before applying.",
    };
  }

  const screeningDocs = await getDocumentsForEntity("prospect", prospect.id);
  if (!hasRequiredScreeningDocuments(screeningDocs)) {
    return {
      error:
        "Upload your government ID and income proof in the screening documents section before applying.",
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

    const [meta] = await db
      .select({
        propertyCode: properties.propertyCode,
        prospectName: users.name,
        prospectEmail: users.email,
      })
      .from(applications)
      .innerJoin(properties, eq(applications.propertyId, properties.id))
      .innerJoin(prospects, eq(applications.prospectId, prospects.id))
      .innerJoin(users, eq(prospects.userId, users.id))
      .where(eq(applications.id, app.id))
      .limit(1);

    if (meta?.prospectEmail) {
      try {
        await notifyLandlordNewApplication({
          prospectName: meta.prospectName ?? "Prospect",
          prospectEmail: meta.prospectEmail,
          propertyCode: meta.propertyCode,
          applicationId: app.id,
        });
      } catch (err) {
        console.error("[application email]", err);
      }
    }
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

    const [meta] = await db
      .select({
        propertyCode: properties.propertyCode,
        prospectName: users.name,
        prospectEmail: users.email,
      })
      .from(applications)
      .innerJoin(properties, eq(applications.propertyId, properties.id))
      .innerJoin(prospects, eq(applications.prospectId, prospects.id))
      .innerJoin(users, eq(prospects.userId, users.id))
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (meta?.prospectEmail) {
      try {
        await notifyProspectStageChange({
          prospectEmail: meta.prospectEmail,
          prospectName: meta.prospectName ?? "Prospect",
          propertyCode: meta.propertyCode,
          stage: newStage,
        });
      } catch (err) {
        console.error("[application stage email]", err);
      }
    }
  }

  revalidatePath("/landlord/pipeline");
  revalidatePath("/agent/pipeline");
  revalidatePath("/landlord/prospects");
  revalidatePath(`/landlord/prospects/${applicationId}`);
  revalidatePath(`/agent/prospects/${applicationId}`);
  revalidatePath("/agent/prospects");
  revalidatePath("/portal/application");
  return { success: "Application updated." };
}

export async function updateApplicationByAgent(
  applicationId: string,
  _prev: ApplicationActionState,
  formData: FormData
): Promise<ApplicationActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") {
    return { error: "Forbidden." };
  }

  const { getAgentProfileByUserId } = await import("@/lib/auth/agent");
  const profile = await getAgentProfileByUserId(session.user.id);
  if (!profile?.isActive) return { error: "Forbidden." };

  const stage = formData.get("stage") as ApplicationStage;
  const notes = (formData.get("notes") as string)?.trim() || undefined;

  if (!AGENT_APPLICATION_STAGES.includes(stage as (typeof AGENT_APPLICATION_STAGES)[number])) {
    return { error: "Agents cannot set this stage." };
  }

  const [current] = await db
    .select({
      stage: applications.stage,
      assignedAgentId: applications.assignedAgentId,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!current) return { error: "Application not found." };
  if (current.assignedAgentId !== profile.id) {
    return { error: "You are not assigned to this prospect." };
  }

  if (current.stage === stage) {
    return { success: "No changes to save." };
  }

  await db
    .update(applications)
    .set({ stage, updatedAt: new Date() })
    .where(eq(applications.id, applicationId));

  await recordStageChange(
    applicationId,
    current.stage,
    stage,
    session.user.id,
    notes
  );

  revalidatePath(`/agent/prospects/${applicationId}`);
  revalidatePath("/agent/prospects");
  revalidatePath(`/landlord/prospects/${applicationId}`);
  revalidatePath("/landlord/pipeline");
  revalidatePath("/agent/pipeline");
  revalidatePath("/portal/application");
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
