import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  agentProfiles,
  applications,
  commissions,
  leases,
  properties,
  prospects,
  tenants,
  users,
} from "@/lib/db/schema";
import type { LeaseTemplateInput } from "@/lib/leases/template";

export async function getApprovedApplicationsForLease() {
  return db
    .select({
      id: applications.id,
      stage: applications.stage,
      propertyId: applications.propertyId,
      propertyCode: properties.propertyCode,
      location: properties.location,
      monthlyRent: properties.monthlyRent,
      securityDeposit: properties.securityDeposit,
      prospectName: users.name,
      assignedAgentId: applications.assignedAgentId,
    })
    .from(applications)
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .innerJoin(prospects, eq(applications.prospectId, prospects.id))
    .innerJoin(users, eq(prospects.userId, users.id))
    .where(eq(applications.stage, "approved"))
    .orderBy(desc(applications.updatedAt));
}

export async function getLeasesForLandlord() {
  const tenantUser = alias(users, "tenant_user");

  return db
    .select({
      id: leases.id,
      startDate: leases.startDate,
      endDate: leases.endDate,
      monthlyRent: leases.monthlyRent,
      status: leases.status,
      signedAt: leases.signedAt,
      documentUrl: leases.documentUrl,
      propertyCode: properties.propertyCode,
      location: properties.location,
      tenantName: tenantUser.name,
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .innerJoin(tenants, eq(leases.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .orderBy(desc(leases.createdAt));
}

export async function getLeaseById(id: string) {
  const tenantUser = alias(users, "tenant_user");

  const [row] = await db
    .select({
      id: leases.id,
      tenantId: leases.tenantId,
      propertyId: leases.propertyId,
      startDate: leases.startDate,
      endDate: leases.endDate,
      monthlyRent: leases.monthlyRent,
      securityDeposit: leases.securityDeposit,
      status: leases.status,
      signedAt: leases.signedAt,
      sentAt: leases.sentAt,
      tenantSignedName: leases.tenantSignedName,
      documentUrl: leases.documentUrl,
      propertyCode: properties.propertyCode,
      location: properties.location,
      calle: properties.calle,
      colonia: properties.colonia,
      ciudad: properties.ciudad,
      estado: properties.estado,
      cp: properties.cp,
      tenantName: tenantUser.name,
      tenantEmail: tenantUser.email,
      applicationId: tenants.applicationId,
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .innerJoin(tenants, eq(leases.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .where(eq(leases.id, id))
    .limit(1);

  return row ?? null;
}

export async function getLeaseTemplateData(leaseId: string): Promise<LeaseTemplateInput | null> {
  const tenantUser = alias(users, "tenant_user");

  const [row] = await db
    .select({
      id: leases.id,
      startDate: leases.startDate,
      endDate: leases.endDate,
      monthlyRent: leases.monthlyRent,
      securityDeposit: leases.securityDeposit,
      propertyCode: properties.propertyCode,
      location: properties.location,
      calle: properties.calle,
      colonia: properties.colonia,
      ciudad: properties.ciudad,
      estado: properties.estado,
      cp: properties.cp,
      pais: properties.pais,
      description: properties.description,
      amenities: properties.amenities,
      tenantName: tenantUser.name,
      tenantEmail: tenantUser.email,
      tenantPhone: tenantUser.phone,
      firstName: prospects.firstName,
      lastName: prospects.lastName,
      currentAddress: prospects.currentAddress,
      occupants: prospects.occupants,
      pets: prospects.pets,
      employment: prospects.employment,
      income: prospects.income,
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .innerJoin(tenants, eq(leases.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .leftJoin(prospects, eq(tenants.prospectId, prospects.id))
    .where(eq(leases.id, leaseId))
    .limit(1);

  if (!row) return null;

  const tenantName =
    [row.firstName, row.lastName].filter(Boolean).join(" ").trim() ||
    row.tenantName ||
    "Tenant";

  return {
    leaseId: row.id,
    propertyCode: row.propertyCode,
    location: row.location,
    address: {
      calle: row.calle,
      colonia: row.colonia,
      ciudad: row.ciudad,
      estado: row.estado,
      cp: row.cp,
      pais: row.pais,
    },
    description: row.description,
    amenities: row.amenities,
    tenant: {
      name: tenantName,
      email: row.tenantEmail,
      phone: row.tenantPhone,
      currentAddress: row.currentAddress,
      occupants: row.occupants,
      pets: row.pets,
      employment: row.employment,
      income: row.income,
    },
    startDate: row.startDate,
    endDate: row.endDate,
    monthlyRent: row.monthlyRent,
    securityDeposit: row.securityDeposit,
  };
}

export async function getLeaseForUser(userId: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.userId, userId))
    .limit(1);

  if (!tenant) return null;

  const tenantUser = alias(users, "tenant_user");

  const [lease] = await db
    .select({
      id: leases.id,
      startDate: leases.startDate,
      endDate: leases.endDate,
      monthlyRent: leases.monthlyRent,
      securityDeposit: leases.securityDeposit,
      status: leases.status,
      signedAt: leases.signedAt,
      sentAt: leases.sentAt,
      documentUrl: leases.documentUrl,
      tenantSignedName: leases.tenantSignedName,
      propertyCode: properties.propertyCode,
      location: properties.location,
      calle: properties.calle,
      colonia: properties.colonia,
      ciudad: properties.ciudad,
      estado: properties.estado,
      cp: properties.cp,
      keycodes: properties.keycodes,
      tenantName: tenantUser.name,
      applicationId: tenants.applicationId,
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .where(eq(leases.tenantId, tenant.id))
    .orderBy(desc(leases.createdAt))
    .limit(1);

  return lease ? { tenant, lease } : null;
}

export async function getTenantsForLandlord() {
  const tenantUser = alias(users, "tenant_user");
  const agentUser = alias(users, "agent_user");

  return db
    .select({
      id: tenants.id,
      status: tenants.status,
      moveInDate: tenants.moveInDate,
      moveOutDate: tenants.moveOutDate,
      propertyCode: properties.propertyCode,
      location: properties.location,
      tenantName: tenantUser.name,
      tenantEmail: tenantUser.email,
      agentName: agentUser.name,
    })
    .from(tenants)
    .innerJoin(properties, eq(tenants.propertyId, properties.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .leftJoin(agentProfiles, eq(tenants.assignedAgentId, agentProfiles.id))
    .leftJoin(agentUser, eq(agentProfiles.userId, agentUser.id))
    .orderBy(desc(tenants.createdAt));
}

export async function getCommissionsForLandlord() {
  const agentUser = alias(users, "agent_user");
  const tenantUser = alias(users, "tenant_user");

  return db
    .select({
      id: commissions.id,
      amount: commissions.amount,
      rate: commissions.rate,
      type: commissions.type,
      status: commissions.status,
      paidAt: commissions.paidAt,
      createdAt: commissions.createdAt,
      agentName: agentUser.name,
      tenantName: tenantUser.name,
      propertyCode: properties.propertyCode,
    })
    .from(commissions)
    .innerJoin(agentProfiles, eq(commissions.agentId, agentProfiles.id))
    .innerJoin(agentUser, eq(agentProfiles.userId, agentUser.id))
    .innerJoin(tenants, eq(commissions.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .innerJoin(properties, eq(tenants.propertyId, properties.id))
    .orderBy(desc(commissions.createdAt));
}

export async function getCommissionsForAgent(agentProfileId: string) {
  const tenantUser = alias(users, "tenant_user");

  return db
    .select({
      id: commissions.id,
      amount: commissions.amount,
      rate: commissions.rate,
      type: commissions.type,
      status: commissions.status,
      paidAt: commissions.paidAt,
      createdAt: commissions.createdAt,
      tenantName: tenantUser.name,
      propertyCode: properties.propertyCode,
    })
    .from(commissions)
    .innerJoin(tenants, eq(commissions.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .innerJoin(properties, eq(tenants.propertyId, properties.id))
    .where(eq(commissions.agentId, agentProfileId))
    .orderBy(desc(commissions.createdAt));
}

export async function getTenantLeaseForUser(userId: string) {
  return getLeaseForUser(userId);
}
