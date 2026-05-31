import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agentProfiles,
  applications,
  applicationStageHistory,
  properties,
  prospects,
  users,
} from "@/lib/db/schema";
import type { ApplicationStage } from "@/lib/db/schema";

export async function getProspectByUserId(userId: string) {
  const [prospect] = await db
    .select()
    .from(prospects)
    .where(eq(prospects.userId, userId))
    .limit(1);
  return prospect ?? null;
}

export async function getUserPhone(userId: string) {
  const [row] = await db
    .select({ phone: users.phone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.phone ?? null;
}

export async function getApplicationsForProspect(prospectId: string) {
  return db
    .select({
      id: applications.id,
      stage: applications.stage,
      rating: applications.rating,
      submittedAt: applications.submittedAt,
      propertyId: applications.propertyId,
      propertyCode: properties.propertyCode,
      location: properties.location,
      calle: properties.calle,
      colonia: properties.colonia,
      ciudad: properties.ciudad,
      monthlyRent: properties.monthlyRent,
    })
    .from(applications)
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .where(eq(applications.prospectId, prospectId))
    .orderBy(desc(applications.createdAt));
}

export async function getApplicationsForLandlord(stage?: ApplicationStage) {
  const rows = await db
    .select({
      id: applications.id,
      stage: applications.stage,
      rating: applications.rating,
      submittedAt: applications.submittedAt,
      landlordNotes: applications.landlordNotes,
      prospectId: applications.prospectId,
      prospectName: users.name,
      prospectEmail: users.email,
      propertyId: applications.propertyId,
      propertyCode: properties.propertyCode,
      location: properties.location,
      ciudad: properties.ciudad,
      assignedAgentId: applications.assignedAgentId,
    })
    .from(applications)
    .innerJoin(prospects, eq(applications.prospectId, prospects.id))
    .innerJoin(users, eq(prospects.userId, users.id))
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .orderBy(desc(applications.updatedAt));

  if (stage) {
    return rows.filter((r) => r.stage === stage);
  }
  return rows;
}

export async function getApplicationsForAgent(agentProfileId: string) {
  return db
    .select({
      id: applications.id,
      stage: applications.stage,
      rating: applications.rating,
      submittedAt: applications.submittedAt,
      prospectName: users.name,
      prospectEmail: users.email,
      propertyCode: properties.propertyCode,
      location: properties.location,
      ciudad: properties.ciudad,
    })
    .from(applications)
    .innerJoin(prospects, eq(applications.prospectId, prospects.id))
    .innerJoin(users, eq(prospects.userId, users.id))
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .where(eq(applications.assignedAgentId, agentProfileId))
    .orderBy(desc(applications.updatedAt));
}

export async function getApplicationDetail(id: string) {
  const [row] = await db
    .select({
      id: applications.id,
      stage: applications.stage,
      rating: applications.rating,
      landlordNotes: applications.landlordNotes,
      submittedAt: applications.submittedAt,
      assignedAgentId: applications.assignedAgentId,
      prospectId: applications.prospectId,
      propertyId: applications.propertyId,
      income: prospects.income,
      employment: prospects.employment,
      previousRentals: prospects.previousRentals,
      references: prospects.references,
      firstName: prospects.firstName,
      lastName: prospects.lastName,
      currentAddress: prospects.currentAddress,
      occupants: prospects.occupants,
      pets: prospects.pets,
      prospectNotes: prospects.notes,
      prospectName: users.name,
      prospectEmail: users.email,
      prospectPhone: users.phone,
      propertyCode: properties.propertyCode,
      location: properties.location,
      calle: properties.calle,
      colonia: properties.colonia,
      ciudad: properties.ciudad,
      estado: properties.estado,
      cp: properties.cp,
      monthlyRent: properties.monthlyRent,
      securityDeposit: properties.securityDeposit,
      commissionRate: properties.commissionRate,
    })
    .from(applications)
    .innerJoin(prospects, eq(applications.prospectId, prospects.id))
    .innerJoin(users, eq(prospects.userId, users.id))
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .where(eq(applications.id, id))
    .limit(1);

  if (!row) return null;

  const history = await db
    .select({
      id: applicationStageHistory.id,
      fromStage: applicationStageHistory.fromStage,
      toStage: applicationStageHistory.toStage,
      notes: applicationStageHistory.notes,
      createdAt: applicationStageHistory.createdAt,
      changedByName: users.name,
    })
    .from(applicationStageHistory)
    .leftJoin(users, eq(applicationStageHistory.changedById, users.id))
    .where(eq(applicationStageHistory.applicationId, id))
    .orderBy(desc(applicationStageHistory.createdAt));

  const agents = await db
    .select({
      id: agentProfiles.id,
      name: users.name,
    })
    .from(agentProfiles)
    .innerJoin(users, eq(agentProfiles.userId, users.id))
    .where(eq(agentProfiles.isActive, true));

  return { application: row, history, agents };
}

export async function getAvailableProperties() {
  return db
    .select({
      id: properties.id,
      propertyCode: properties.propertyCode,
      location: properties.location,
      calle: properties.calle,
      colonia: properties.colonia,
      ciudad: properties.ciudad,
      monthlyRent: properties.monthlyRent,
      description: properties.description,
    })
    .from(properties)
    .where(eq(properties.status, "available"))
    .orderBy(properties.location, properties.propertyCode);
}
