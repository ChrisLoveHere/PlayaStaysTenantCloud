import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { moveChecklists, properties, tenants, users } from "@/lib/db/schema";
import type { MoveChecklistType } from "@/lib/db/schema";

export async function getMoveChecklistsForTenant(tenantId: string) {
  const completedBy = alias(users, "completed_by");

  return db
    .select({
      id: moveChecklists.id,
      type: moveChecklists.type,
      depositHeld: moveChecklists.depositHeld,
      depositReturned: moveChecklists.depositReturned,
      deductionNotes: moveChecklists.deductionNotes,
      conditionNotes: moveChecklists.conditionNotes,
      completedAt: moveChecklists.completedAt,
      completedByName: completedBy.name,
      createdAt: moveChecklists.createdAt,
    })
    .from(moveChecklists)
    .leftJoin(completedBy, eq(moveChecklists.completedById, completedBy.id))
    .where(eq(moveChecklists.tenantId, tenantId))
    .orderBy(desc(moveChecklists.createdAt));
}

export async function getTenantByIdForLandlord(tenantId: string) {
  const tenantUser = alias(users, "tenant_user");

  const [row] = await db
    .select({
      id: tenants.id,
      status: tenants.status,
      moveInDate: tenants.moveInDate,
      moveOutDate: tenants.moveOutDate,
      propertyId: tenants.propertyId,
      propertyCode: properties.propertyCode,
      location: properties.location,
      securityDeposit: properties.securityDeposit,
      monthlyRent: properties.monthlyRent,
      tenantName: tenantUser.name,
      tenantEmail: tenantUser.email,
      tenantPhone: tenantUser.phone,
    })
    .from(tenants)
    .innerJoin(properties, eq(tenants.propertyId, properties.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return row ?? null;
}

export async function getMoveChecklistByType(
  tenantId: string,
  type: MoveChecklistType
) {
  const [row] = await db
    .select({ id: moveChecklists.id })
    .from(moveChecklists)
    .where(and(eq(moveChecklists.tenantId, tenantId), eq(moveChecklists.type, type)))
    .limit(1);
  return row ?? null;
}
