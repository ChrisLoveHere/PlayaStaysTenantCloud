import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agentProfiles,
  applications,
  commissions,
  leases,
  properties,
  tenants,
  users,
} from "@/lib/db/schema";
import type { ApplicationStage } from "@/lib/db/schema";
import { recordStageChangeInternal } from "@/lib/actions/application-stage";

export function calculateCommission(
  monthlyRent: number,
  type: "percent" | "flat",
  rate: number
) {
  if (type === "percent") {
    return Math.round((monthlyRent * rate) / 100);
  }
  return rate;
}

export async function advanceApplicationToStage(
  applicationId: string,
  toStage: ApplicationStage,
  changedById: string,
  notes: string
) {
  const [app] = await db
    .select({ stage: applications.stage })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!app || app.stage === toStage) return;

  await db
    .update(applications)
    .set({ stage: toStage, updatedAt: new Date() })
    .where(eq(applications.id, applicationId));

  await recordStageChangeInternal(
    applicationId,
    app.stage,
    toStage,
    changedById,
    notes
  );
}

export async function completeLeaseMoveIn(
  leaseId: string,
  changedById: string,
  moveInDate?: Date
) {
  const [lease] = await db
    .select()
    .from(leases)
    .where(eq(leases.id, leaseId))
    .limit(1);

  if (!lease || lease.status !== "signed") {
    throw new Error("Lease must be signed before move-in.");
  }

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, lease.tenantId))
    .limit(1);

  if (!tenant) throw new Error("Tenant not found.");

  const effectiveMoveIn = moveInDate ?? lease.startDate;

  await db
    .update(users)
    .set({ role: "tenant", updatedAt: new Date() })
    .where(eq(users.id, tenant.userId));

  await db
    .update(tenants)
    .set({ moveInDate: effectiveMoveIn, updatedAt: new Date() })
    .where(eq(tenants.id, tenant.id));

  await db
    .update(properties)
    .set({ status: "occupied", updatedAt: new Date() })
    .where(eq(properties.id, lease.propertyId));

  if (tenant.applicationId) {
    await advanceApplicationToStage(
      tenant.applicationId,
      "moved_in",
      changedById,
      "Tenant move-in confirmed"
    );
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
