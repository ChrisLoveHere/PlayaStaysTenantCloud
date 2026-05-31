"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  agentProfiles,
  applicationStageHistory,
  applications,
  commissions,
  leases,
  properties,
  prospects,
  tenants,
  users,
} from "@/lib/db/schema";
import type { ApplicationStage, LeaseStatus } from "@/lib/db/schema";
import { parseMXNToCents } from "@/lib/utils/format";
import { insertDocumentRecord } from "@/lib/actions/documents";
import { buildLeaseHtml } from "@/lib/leases/template";
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

function calculateCommission(
  monthlyRent: number,
  type: "percent" | "flat",
  rate: number
) {
  if (type === "percent") {
    return Math.round((monthlyRent * rate) / 100);
  }
  return rate;
}

export async function createLeaseFromApplication(
  _prev: LeaseActionState,
  formData: FormData
): Promise<LeaseActionState> {
  const session = await requireLandlord();

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

  await db
    .update(applications)
    .set({ stage: "lease_sent", updatedAt: new Date() })
    .where(eq(applications.id, app.id));

  await recordStageChange(
    app.id,
    "approved",
    "lease_sent",
    session.user.id,
    `Lease ${lease.id} created`
  );

  revalidatePath("/landlord/leases");
  revalidatePath("/landlord/prospects");
  redirect(`/landlord/leases/${lease.id}`);
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

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, lease.tenantId))
    .limit(1);

  if (!tenant) return { error: "Tenant not found." };

  await db
    .update(leases)
    .set({
      status,
      signedAt: status === "signed" ? new Date() : lease.signedAt,
      updatedAt: new Date(),
    })
    .where(eq(leases.id, leaseId));

  if (status === "signed" && lease.status !== "signed") {
    await db
      .update(users)
      .set({ role: "tenant", updatedAt: new Date() })
      .where(eq(users.id, tenant.userId));

    const moveInDate = parsed.data.moveInDate
      ? new Date(parsed.data.moveInDate)
      : lease.startDate;

    await db
      .update(tenants)
      .set({ moveInDate, updatedAt: new Date() })
      .where(eq(tenants.id, tenant.id));

    await db
      .update(properties)
      .set({ status: "occupied", updatedAt: new Date() })
      .where(eq(properties.id, lease.propertyId));

    if (tenant.applicationId) {
      const [app] = await db
        .select({ stage: applications.stage })
        .from(applications)
        .where(eq(applications.id, tenant.applicationId))
        .limit(1);

      if (app) {
        await db
          .update(applications)
          .set({ stage: "moved_in", updatedAt: new Date() })
          .where(eq(applications.id, tenant.applicationId));

        await recordStageChange(
          tenant.applicationId,
          app.stage,
          "moved_in",
          session.user.id,
          "Lease signed — tenant moved in"
        );
      }
    }

    if (tenant.assignedAgentId) {
      const [agent] = await db
        .select()
        .from(agentProfiles)
        .where(eq(agentProfiles.id, tenant.assignedAgentId))
        .limit(1);

      const [property] = await db
        .select({ commissionRate: properties.commissionRate })
        .from(properties)
        .where(eq(properties.id, lease.propertyId))
        .limit(1);

      if (agent) {
        const [existing] = await db
          .select({ id: commissions.id })
          .from(commissions)
          .where(eq(commissions.leaseId, leaseId))
          .limit(1);

        if (!existing) {
          const rate =
            property?.commissionRate != null
              ? property.commissionRate
              : agent.commissionRate;
          const type =
            property?.commissionRate != null ? "percent" : agent.commissionType;

          const amount = calculateCommission(lease.monthlyRent, type, rate);

          await db.insert(commissions).values({
            agentId: agent.id,
            leaseId,
            tenantId: tenant.id,
            amount,
            rate,
            type,
            status: "pending",
          });
        }
      }
    }
  }

  revalidatePath("/landlord/leases");
  revalidatePath(`/landlord/leases/${leaseId}`);
  revalidatePath("/landlord/tenants");
  revalidatePath("/landlord/commissions");
  revalidatePath("/agent/commissions");
  revalidatePath("/portal");
  revalidatePath("/portal/lease");
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

  revalidatePath(`/landlord/leases/${leaseId}`);
  revalidatePath("/portal/lease");
  return { success: "Document uploaded." };
}

export async function generateLeaseDocument(
  leaseId: string,
  _prev: LeaseActionState,
  _formData: FormData
): Promise<LeaseActionState> {
  const session = await requireLandlord();

  const { getLeaseById } = await import("@/lib/queries/leases");
  const lease = await getLeaseById(leaseId);
  if (!lease) return { error: "Lease not found." };

  const html = buildLeaseHtml({
    leaseId: lease.id,
    propertyCode: lease.propertyCode,
    location: lease.location,
    address: {
      calle: lease.calle,
      colonia: lease.colonia,
      ciudad: lease.ciudad,
      estado: lease.estado,
      cp: lease.cp,
    },
    tenantName: lease.tenantName ?? "Tenant",
    tenantEmail: lease.tenantEmail,
    startDate: lease.startDate,
    endDate: lease.endDate,
    monthlyRent: lease.monthlyRent,
    securityDeposit: lease.securityDeposit,
  });

  const filename = `lease-${lease.propertyCode}-${lease.id.slice(0, 8)}.html`;
  const file = new File([html], filename, { type: "text/html" });
  const { saveUploadedFile } = await import("@/lib/utils/upload");
  const url = await saveUploadedFile(file, "leases");

  await insertDocumentRecord({
    entityType: "lease",
    entityId: leaseId,
    name: filename,
    url,
    mimeType: "text/html",
    uploadedById: session.user.id,
  });

  if (lease.status === "draft") {
    await db
      .update(leases)
      .set({ status: "sent", updatedAt: new Date() })
      .where(eq(leases.id, leaseId));

    if (lease.applicationId) {
      const [app] = await db
        .select({ stage: applications.stage })
        .from(applications)
        .where(eq(applications.id, lease.applicationId))
        .limit(1);

      if (app) {
        await db
          .update(applications)
          .set({ stage: "lease_sent", updatedAt: new Date() })
          .where(eq(applications.id, lease.applicationId));

        if (app.stage !== "lease_sent") {
          await recordStageChange(
            lease.applicationId,
            app.stage,
            "lease_sent",
            session.user.id,
            "Lease document generated"
          );
        }
      }
    }
  }

  revalidatePath(`/landlord/leases/${leaseId}`);
  revalidatePath("/landlord/leases");
  revalidatePath("/portal/lease");
  return { success: "Lease document generated." };
}
