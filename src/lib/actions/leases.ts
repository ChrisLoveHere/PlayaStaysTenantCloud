"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  applications,
  leases,
  properties,
  prospects,
  tenants,
} from "@/lib/db/schema";
import type { LeaseStatus } from "@/lib/db/schema";
import { parseMXNToCents } from "@/lib/utils/format";
import { insertDocumentRecord } from "@/lib/actions/documents";
import { buildLeaseHtml } from "@/lib/leases/template";
import {
  advanceApplicationToStage,
  completeLeaseMoveIn,
} from "@/lib/leases/lifecycle";
import { getLeaseTemplateData } from "@/lib/queries/leases";
import { getDocumentsForEntity } from "@/lib/queries/documents";
import { sendEmail } from "@/lib/email/client";
import { leaseSentEmail } from "@/lib/email/templates";
import { signLeaseSchema } from "@/lib/validations/lease-sign";
import {
  createLeaseSchema,
  updateLeaseStatusSchema,
} from "@/lib/validations/lease";

export type LeaseActionState = {
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

async function saveLeaseHtmlDocument(
  leaseId: string,
  filename: string,
  html: string,
  uploadedById: string
) {
  const file = new File([html], filename, { type: "text/html" });
  const { saveUploadedFile } = await import("@/lib/utils/upload");
  const url = await saveUploadedFile(file, "leases");

  await insertDocumentRecord({
    entityType: "lease",
    entityId: leaseId,
    name: filename,
    url,
    mimeType: "text/html",
    uploadedById,
  });

  await db
    .update(leases)
    .set({ documentUrl: url, updatedAt: new Date() })
    .where(eq(leases.id, leaseId));

  return url;
}

function revalidateLeasePaths(leaseId?: string) {
  revalidatePath("/landlord/leases");
  revalidatePath("/landlord/prospects");
  revalidatePath("/landlord/pipeline");
  revalidatePath("/portal/lease");
  revalidatePath("/portal/application");
  revalidatePath("/landlord/tenants");
  revalidatePath("/landlord/commissions");
  revalidatePath("/agent/commissions");
  revalidatePath("/portal");
  if (leaseId) revalidatePath(`/landlord/leases/${leaseId}`);
}

export async function createLeaseFromApplication(
  _prev: LeaseActionState,
  formData: FormData
): Promise<LeaseActionState> {
  await requireLandlord();

  const parsed = createLeaseSchema.safeParse({
    applicationId: formData.get("applicationId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    monthlyRent: formData.get("monthlyRent") || undefined,
    securityDeposit: formData.get("securityDeposit") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please fill in all required fields." };
  }

  const [app] = await db
    .select({
      id: applications.id,
      stage: applications.stage,
      prospectId: applications.prospectId,
      propertyId: applications.propertyId,
      assignedAgentId: applications.assignedAgentId,
    })
    .from(applications)
    .where(eq(applications.id, parsed.data.applicationId))
    .limit(1);

  if (!app) return { error: "Application not found." };
  if (app.stage !== "approved") {
    return { error: "Application must be approved before creating a lease." };
  }

  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, app.propertyId))
    .limit(1);

  if (!property) return { error: "Property not found." };

  const [prospect] = await db
    .select({ userId: prospects.userId })
    .from(prospects)
    .where(eq(prospects.id, app.prospectId))
    .limit(1);

  if (!prospect) return { error: "Prospect not found." };

  const startDate = new Date(parsed.data.startDate);
  const endDate = new Date(parsed.data.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Invalid dates." };
  }

  const monthlyRent = parsed.data.monthlyRent
    ? parseMXNToCents(parsed.data.monthlyRent)
    : property.monthlyRent;
  const securityDeposit = parsed.data.securityDeposit
    ? parseMXNToCents(parsed.data.securityDeposit)
    : property.securityDeposit;

  let [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.userId, prospect.userId))
    .limit(1);

  if (!tenant) {
    [tenant] = await db
      .insert(tenants)
      .values({
        userId: prospect.userId,
        propertyId: app.propertyId,
        assignedAgentId: app.assignedAgentId,
        prospectId: app.prospectId,
        applicationId: app.id,
        status: "active",
      })
      .returning();
  }

  const [lease] = await db
    .insert(leases)
    .values({
      tenantId: tenant.id,
      propertyId: app.propertyId,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      status: "draft",
    })
    .returning();

  revalidateLeasePaths(lease.id);
  redirect(`/landlord/leases/${lease.id}`);
}

export async function generateLeaseDocument(
  leaseId: string,
  _prev: LeaseActionState,
  _formData: FormData
): Promise<LeaseActionState> {
  const session = await requireLandlord();

  const [lease] = await db
    .select({ status: leases.status, id: leases.id })
    .from(leases)
    .where(eq(leases.id, leaseId))
    .limit(1);

  if (!lease) return { error: "Lease not found." };
  if (lease.status !== "draft" && lease.status !== "sent") {
    return { error: "Lease can only be generated while draft or sent." };
  }

  const templateData = await getLeaseTemplateData(leaseId);
  if (!templateData) return { error: "Could not load lease details." };

  const html = buildLeaseHtml(templateData);
  const filename = `lease-${templateData.propertyCode}-${leaseId.slice(0, 8)}.html`;
  await saveLeaseHtmlDocument(leaseId, filename, html, session.user.id);

  revalidateLeasePaths(leaseId);
  return { success: "Lease document generated from property and tenant profile." };
}

export async function sendLeaseToTenant(
  leaseId: string,
  _prev: LeaseActionState,
  _formData: FormData
): Promise<LeaseActionState> {
  const session = await requireLandlord();

  const templateData = await getLeaseTemplateData(leaseId);
  if (!templateData) return { error: "Lease not found." };

  const [lease] = await db
    .select({
      status: leases.status,
      documentUrl: leases.documentUrl,
    })
    .from(leases)
    .where(eq(leases.id, leaseId))
    .limit(1);

  if (!lease) return { error: "Lease not found." };
  if (lease.status !== "draft" && lease.status !== "sent") {
    return { error: "Only draft leases can be sent." };
  }

  const documents = await getDocumentsForEntity("lease", leaseId);
  if (documents.length === 0 && !lease.documentUrl) {
    return { error: "Generate the lease document before sending." };
  }

  const now = new Date();
  await db
    .update(leases)
    .set({ status: "sent", sentAt: now, updatedAt: now })
    .where(eq(leases.id, leaseId));

  const [tenantRow] = await db
    .select({ applicationId: tenants.applicationId })
    .from(tenants)
    .innerJoin(leases, eq(leases.tenantId, tenants.id))
    .where(eq(leases.id, leaseId))
    .limit(1);

  if (tenantRow?.applicationId) {
    await advanceApplicationToStage(
      tenantRow.applicationId,
      "lease_sent",
      session.user.id,
      "Lease sent to tenant for signing"
    );
  }

  const email = leaseSentEmail({
    tenantName: templateData.tenant.name,
    propertyCode: templateData.propertyCode,
    startDate: templateData.startDate,
    endDate: templateData.endDate,
    monthlyRent: templateData.monthlyRent,
  });

  await sendEmail({
    to: templateData.tenant.email,
    subject: email.subject,
    html: email.html,
  });

  revalidateLeasePaths(leaseId);
  return { success: "Lease sent to tenant for signing." };
}

export async function signLease(
  leaseId: string,
  _prev: LeaseActionState,
  formData: FormData
): Promise<LeaseActionState> {
  const session = await auth();
  if (!session?.user) return { error: "You must be signed in." };

  const parsed = signLeaseSchema.safeParse({
    signedName: formData.get("signedName"),
    signatureData: formData.get("signatureData"),
    agreed: formData.get("agreed"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid signing data.";
    return { error: message };
  }

  const [lease] = await db
    .select({
      id: leases.id,
      status: leases.status,
      tenantId: leases.tenantId,
    })
    .from(leases)
    .where(eq(leases.id, leaseId))
    .limit(1);

  if (!lease) return { error: "Lease not found." };
  if (lease.status !== "sent") {
    return { error: "This lease is not available for signing." };
  }

  const [tenant] = await db
    .select({
      userId: tenants.userId,
      applicationId: tenants.applicationId,
    })
    .from(tenants)
    .where(eq(tenants.id, lease.tenantId))
    .limit(1);

  if (!tenant || tenant.userId !== session.user.id) {
    return { error: "You are not authorized to sign this lease." };
  }

  const templateData = await getLeaseTemplateData(leaseId);
  if (!templateData) return { error: "Could not load lease details." };

  const signedAt = new Date();
  const html = buildLeaseHtml({
    ...templateData,
    signature: {
      name: parsed.data.signedName,
      imageDataUrl: parsed.data.signatureData,
      signedAt,
    },
  });

  const filename = `lease-signed-${templateData.propertyCode}-${leaseId.slice(0, 8)}.html`;
  const url = await saveLeaseHtmlDocument(
    leaseId,
    filename,
    html,
    session.user.id
  );

  await db
    .update(leases)
    .set({
      status: "signed",
      signedAt,
      tenantSignedName: parsed.data.signedName,
      tenantSignature: parsed.data.signatureData,
      documentUrl: url,
      updatedAt: signedAt,
    })
    .where(eq(leases.id, leaseId));

  if (tenant.applicationId) {
    await advanceApplicationToStage(
      tenant.applicationId,
      "lease_signed",
      session.user.id,
      `Lease signed by ${parsed.data.signedName}`
    );
  }

  revalidateLeasePaths(leaseId);
  return { success: "Lease signed successfully. Your landlord will confirm move-in." };
}

export async function confirmLeaseMoveIn(
  leaseId: string,
  _prev: LeaseActionState,
  formData: FormData
): Promise<LeaseActionState> {
  const session = await requireLandlord();

  const moveInRaw = formData.get("moveInDate");
  const moveInDate =
    typeof moveInRaw === "string" && moveInRaw
      ? new Date(moveInRaw)
      : undefined;

  if (moveInDate && Number.isNaN(moveInDate.getTime())) {
    return { error: "Invalid move-in date." };
  }

  try {
    await completeLeaseMoveIn(leaseId, session.user.id, moveInDate);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not confirm move-in.",
    };
  }

  revalidateLeasePaths(leaseId);
  return { success: "Move-in confirmed. Tenant role and commission updated." };
}

export async function updateLeaseStatus(
  leaseId: string,
  _prev: LeaseActionState,
  formData: FormData
): Promise<LeaseActionState> {
  const session = await requireLandlord();

  const parsed = updateLeaseStatusSchema.safeParse({
    status: formData.get("status"),
    moveInDate: formData.get("moveInDate") || undefined,
  });

  if (!parsed.success) return { error: "Invalid status." };

  const status = parsed.data.status as LeaseStatus;

  const [lease] = await db
    .select()
    .from(leases)
    .where(eq(leases.id, leaseId))
    .limit(1);

  if (!lease) return { error: "Lease not found." };

  await db
    .update(leases)
    .set({
      status,
      signedAt: status === "signed" ? new Date() : lease.signedAt,
      updatedAt: new Date(),
    })
    .where(eq(leases.id, leaseId));

  if (status === "signed" && lease.status !== "signed") {
    const [tenant] = await db
      .select({ applicationId: tenants.applicationId })
      .from(tenants)
      .where(eq(tenants.id, lease.tenantId))
      .limit(1);

    if (tenant?.applicationId) {
      await advanceApplicationToStage(
        tenant.applicationId,
        "lease_signed",
        session.user.id,
        "Lease marked signed by landlord"
      );
    }
  }

  revalidateLeasePaths(leaseId);
  return { success: `Lease marked as ${status}.` };
}

export async function uploadLeaseDocument(
  leaseId: string,
  _prev: LeaseActionState,
  formData: FormData
): Promise<LeaseActionState> {
  const session = await requireLandlord();

  const file = formData.get("document") as File | null;
  if (!file || file.size === 0) {
    return { error: "Please select a file." };
  }

  const { saveUploadedFile } = await import("@/lib/utils/upload");
  const url = await saveUploadedFile(file, "leases");

  await insertDocumentRecord({
    entityType: "lease",
    entityId: leaseId,
    name: file.name || "Lease document",
    url,
    mimeType: file.type || null,
    uploadedById: session.user.id,
  });

  revalidateLeasePaths(leaseId);
  return { success: "Document uploaded." };
}
