import { desc, eq, inArray, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  agentProfiles,
  applications,
  properties,
  prospects,
  showings,
  users,
} from "@/lib/db/schema";
import type { ApplicationStage } from "@/lib/db/schema";
import {
  stageToColumnId,
  type PipelineColumnId,
} from "@/lib/constants/pipeline";

export type PipelineApplicationRow = {
  id: string;
  stage: ApplicationStage;
  rating: number | null;
  submittedAt: Date | null;
  updatedAt: Date;
  prospectId: string;
  prospectName: string | null;
  prospectEmail: string;
  prospectPhone: string | null;
  propertyId: string;
  propertyCode: string;
  location: string;
  ciudad: string;
  monthlyRent: number;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  prospectIncome: number | null;
};

export type PipelineProspectRow = {
  prospectId: string;
  prospectName: string | null;
  prospectEmail: string;
  prospectPhone: string | null;
  registeredAt: Date;
};

export type PipelineShowingSummary = {
  id: string;
  prospectId: string;
  propertyId: string;
  propertyCode: string;
  scheduledAt: Date;
  status: string;
};

export type PipelineDeal = {
  id: string;
  kind: "application" | "prospect";
  prospectId: string;
  applicationId: string | null;
  prospectName: string | null;
  prospectEmail: string;
  prospectPhone: string | null;
  propertyCode: string | null;
  propertyId: string | null;
  location: string | null;
  monthlyRent: number | null;
  stage: ApplicationStage | "registered";
  columnId: PipelineColumnId;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  submittedAt: Date | null;
  updatedAt: Date;
  nextShowingAt: Date | null;
  rating: number | null;
};

export type PipelineProspectInterest = {
  applicationId: string;
  propertyCode: string;
  location: string;
  stage: ApplicationStage;
  monthlyRent: number;
};

export type PipelineDealDetail = {
  deal: PipelineDeal;
  applications: PipelineProspectInterest[];
  showings: PipelineShowingSummary[];
  income: number | null;
  occupants: number | null;
  currentAddress: string | null;
  pets: string | null;
};

function buildShowingMap(showingsList: PipelineShowingSummary[]) {
  const map = new Map<string, Date>();
  for (const s of showingsList) {
    if (s.status === "cancelled") continue;
    const key = `${s.prospectId}:${s.propertyId}`;
    const existing = map.get(key);
    if (!existing || s.scheduledAt < existing) {
      map.set(key, s.scheduledAt);
    }
  }
  return map;
}

function applicationToDeal(
  row: PipelineApplicationRow,
  showingMap: Map<string, Date>
): PipelineDeal {
  const showingKey = `${row.prospectId}:${row.propertyId}`;
  return {
    id: row.id,
    kind: "application",
    prospectId: row.prospectId,
    applicationId: row.id,
    prospectName: row.prospectName,
    prospectEmail: row.prospectEmail,
    prospectPhone: row.prospectPhone,
    propertyCode: row.propertyCode,
    propertyId: row.propertyId,
    location: row.location,
    monthlyRent: row.monthlyRent,
    stage: row.stage,
    columnId: stageToColumnId(row.stage),
    assignedAgentId: row.assignedAgentId,
    assignedAgentName: row.assignedAgentName,
    submittedAt: row.submittedAt,
    updatedAt: row.updatedAt,
    nextShowingAt: showingMap.get(showingKey) ?? null,
    rating: row.rating,
  };
}

function prospectToDeal(row: PipelineProspectRow): PipelineDeal {
  return {
    id: `prospect-${row.prospectId}`,
    kind: "prospect",
    prospectId: row.prospectId,
    applicationId: null,
    prospectName: row.prospectName,
    prospectEmail: row.prospectEmail,
    prospectPhone: row.prospectPhone,
    propertyCode: null,
    propertyId: null,
    location: null,
    monthlyRent: null,
    stage: "registered",
    columnId: "new_deal",
    assignedAgentId: null,
    assignedAgentName: null,
    submittedAt: null,
    updatedAt: row.registeredAt,
    nextShowingAt: null,
    rating: null,
  };
}

async function fetchApplications(
  assignedAgentId?: string | null
): Promise<PipelineApplicationRow[]> {
  const agentUser = alias(users, "agent_user");

  const rows = await db
    .select({
      id: applications.id,
      stage: applications.stage,
      rating: applications.rating,
      submittedAt: applications.submittedAt,
      updatedAt: applications.updatedAt,
      prospectId: applications.prospectId,
      prospectName: users.name,
      prospectEmail: users.email,
      prospectPhone: users.phone,
      propertyId: applications.propertyId,
      propertyCode: properties.propertyCode,
      location: properties.location,
      ciudad: properties.ciudad,
      monthlyRent: properties.monthlyRent,
      assignedAgentId: applications.assignedAgentId,
      assignedAgentName: agentUser.name,
      prospectIncome: prospects.income,
    })
    .from(applications)
    .innerJoin(prospects, eq(applications.prospectId, prospects.id))
    .innerJoin(users, eq(prospects.userId, users.id))
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .leftJoin(agentProfiles, eq(applications.assignedAgentId, agentProfiles.id))
    .leftJoin(agentUser, eq(agentProfiles.userId, agentUser.id))
    .orderBy(desc(applications.updatedAt));

  if (assignedAgentId) {
    return rows.filter((r) => r.assignedAgentId === assignedAgentId);
  }
  return rows;
}

async function fetchProspectsWithoutApplications(
  assignedAgentId?: string | null
): Promise<PipelineProspectRow[]> {
  if (assignedAgentId) {
    return [];
  }

  return db
    .select({
      prospectId: prospects.id,
      prospectName: users.name,
      prospectEmail: users.email,
      prospectPhone: users.phone,
      registeredAt: users.createdAt,
    })
    .from(prospects)
    .innerJoin(users, eq(prospects.userId, users.id))
    .leftJoin(applications, eq(applications.prospectId, prospects.id))
    .where(isNull(applications.id))
    .orderBy(desc(users.createdAt));
}

async function fetchShowingsForProspects(prospectIds: string[]) {
  if (prospectIds.length === 0) return [] as PipelineShowingSummary[];

  return db
    .select({
      id: showings.id,
      prospectId: showings.prospectId,
      propertyId: showings.propertyId,
      propertyCode: properties.propertyCode,
      scheduledAt: showings.scheduledAt,
      status: showings.status,
    })
    .from(showings)
    .innerJoin(properties, eq(showings.propertyId, properties.id))
    .where(inArray(showings.prospectId, prospectIds))
    .orderBy(showings.scheduledAt);
}

export async function getPipelineDeals(options?: {
  assignedAgentId?: string | null;
  agentFilter?: string | null;
}) {
  let agentScope = options?.assignedAgentId;

  if (!agentScope && options?.agentFilter === "unassigned") {
    const applicationRows = await fetchApplications();
    const prospectRows = await fetchProspectsWithoutApplications();
    const prospectIds = [
      ...new Set([
        ...applicationRows.map((r) => r.prospectId),
        ...prospectRows.map((r) => r.prospectId),
      ]),
    ];
    const showingsList = await fetchShowingsForProspects(prospectIds);
    const showingMap = buildShowingMap(showingsList);

    const unassignedApps = applicationRows.filter((r) => !r.assignedAgentId);
    const deals: PipelineDeal[] = [
      ...prospectRows.map(prospectToDeal),
      ...unassignedApps.map((r) => applicationToDeal(r, showingMap)),
    ];
    deals.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return { deals, showings: showingsList };
  }

  if (!agentScope && options?.agentFilter && options.agentFilter !== "all") {
    agentScope = options.agentFilter;
  }

  const [applicationRows, prospectRows] = await Promise.all([
    fetchApplications(agentScope),
    fetchProspectsWithoutApplications(agentScope),
  ]);

  const prospectIds = [
    ...new Set([
      ...applicationRows.map((r) => r.prospectId),
      ...prospectRows.map((r) => r.prospectId),
    ]),
  ];

  const showingsList = await fetchShowingsForProspects(prospectIds);
  const showingMap = buildShowingMap(showingsList);

  const deals: PipelineDeal[] = [
    ...prospectRows.map(prospectToDeal),
    ...applicationRows.map((r) => applicationToDeal(r, showingMap)),
  ];

  deals.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return { deals, showings: showingsList };
}

export async function getActiveAgentsForPipeline() {
  return db
    .select({
      id: agentProfiles.id,
      name: users.name,
    })
    .from(agentProfiles)
    .innerJoin(users, eq(agentProfiles.userId, users.id))
    .where(eq(agentProfiles.isActive, true))
    .orderBy(users.name);
}

export async function getPipelineDealDetail(
  dealId: string
): Promise<PipelineDealDetail | null> {
  const { deals } = await getPipelineDeals();
  const deal = deals.find((d) => d.id === dealId) ?? null;
  if (!deal) return null;

  const pid = deal.prospectId;

  const [appRows, showingsList, prospectRow] = await Promise.all([
    db
      .select({
        applicationId: applications.id,
        propertyCode: properties.propertyCode,
        location: properties.location,
        stage: applications.stage,
        monthlyRent: properties.monthlyRent,
      })
      .from(applications)
      .innerJoin(properties, eq(applications.propertyId, properties.id))
      .where(eq(applications.prospectId, pid))
      .orderBy(desc(applications.updatedAt)),
    fetchShowingsForProspects([pid]),
    db
      .select({
        income: prospects.income,
        occupants: prospects.occupants,
        currentAddress: prospects.currentAddress,
        pets: prospects.pets,
      })
      .from(prospects)
      .where(eq(prospects.id, pid))
      .limit(1),
  ]);

  return {
    deal,
    applications: appRows,
    showings: showingsList,
    income: prospectRow[0]?.income ?? null,
    occupants: prospectRow[0]?.occupants ?? null,
    currentAddress: prospectRow[0]?.currentAddress ?? null,
    pets: prospectRow[0]?.pets ?? null,
  };
}
