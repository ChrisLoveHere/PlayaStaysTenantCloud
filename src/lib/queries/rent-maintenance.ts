import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  maintenanceRequests,
  properties,
  rentPayments,
  tenants,
  users,
} from "@/lib/db/schema";

export async function getTenantByUserId(userId: string) {
  const [tenant] = await db
    .select({
      id: tenants.id,
      propertyId: tenants.propertyId,
      status: tenants.status,
      propertyCode: properties.propertyCode,
      location: properties.location,
      monthlyRent: properties.monthlyRent,
    })
    .from(tenants)
    .innerJoin(properties, eq(tenants.propertyId, properties.id))
    .where(eq(tenants.userId, userId))
    .limit(1);
  return tenant ?? null;
}

export async function getActiveTenantsForRent() {
  const tenantUser = alias(users, "tenant_user");

  return db
    .select({
      id: tenants.id,
      propertyId: tenants.propertyId,
      propertyCode: properties.propertyCode,
      location: properties.location,
      monthlyRent: properties.monthlyRent,
      tenantName: tenantUser.name,
    })
    .from(tenants)
    .innerJoin(properties, eq(tenants.propertyId, properties.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .where(eq(tenants.status, "active"))
    .orderBy(tenantUser.name);
}

export async function getRentPaymentsForLandlord() {
  const tenantUser = alias(users, "tenant_user");

  return db
    .select({
      id: rentPayments.id,
      amount: rentPayments.amount,
      dueDate: rentPayments.dueDate,
      paidDate: rentPayments.paidDate,
      status: rentPayments.status,
      paymentMethod: rentPayments.paymentMethod,
      reference: rentPayments.reference,
      notes: rentPayments.notes,
      tenantName: tenantUser.name,
      propertyCode: properties.propertyCode,
      location: properties.location,
    })
    .from(rentPayments)
    .innerJoin(tenants, eq(rentPayments.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
    .orderBy(desc(rentPayments.dueDate));
}

export async function getRentPaymentsForTenant(tenantId: string) {
  return db
    .select()
    .from(rentPayments)
    .where(eq(rentPayments.tenantId, tenantId))
    .orderBy(desc(rentPayments.dueDate));
}

export async function getMaintenanceForLandlord() {
  const tenantUser = alias(users, "tenant_user");

  return db
    .select({
      id: maintenanceRequests.id,
      title: maintenanceRequests.title,
      description: maintenanceRequests.description,
      priority: maintenanceRequests.priority,
      status: maintenanceRequests.status,
      submittedAt: maintenanceRequests.submittedAt,
      resolvedAt: maintenanceRequests.resolvedAt,
      tenantName: tenantUser.name,
      propertyCode: properties.propertyCode,
      location: properties.location,
    })
    .from(maintenanceRequests)
    .innerJoin(tenants, eq(maintenanceRequests.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .innerJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
    .orderBy(desc(maintenanceRequests.submittedAt));
}

export async function getMaintenanceForTenant(tenantId: string) {
  return db
    .select()
    .from(maintenanceRequests)
    .where(eq(maintenanceRequests.tenantId, tenantId))
    .orderBy(desc(maintenanceRequests.submittedAt));
}
