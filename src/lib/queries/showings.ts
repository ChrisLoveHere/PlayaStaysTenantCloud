import { and, desc, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  agentAvailabilityBlocks,
  agentProfiles,
  applications,
  properties,
  prospects,
  showings,
  users,
} from "@/lib/db/schema";

export async function getShowingsForLandlord() {
  const prospectUser = alias(users, "prospect_user");
  const agentUser = alias(users, "agent_user");

  return db
    .select({
      id: showings.id,
      scheduledAt: showings.scheduledAt,
      durationMinutes: showings.durationMinutes,
      status: showings.status,
      outcomeNotes: showings.outcomeNotes,
      propertyId: showings.propertyId,
      propertyCode: properties.propertyCode,
      location: properties.location,
      prospectId: showings.prospectId,
      prospectName: prospectUser.name,
      agentId: showings.agentId,
      agentName: agentUser.name,
    })
    .from(showings)
    .innerJoin(properties, eq(showings.propertyId, properties.id))
    .innerJoin(prospects, eq(showings.prospectId, prospects.id))
    .innerJoin(prospectUser, eq(prospects.userId, prospectUser.id))
    .innerJoin(agentProfiles, eq(showings.agentId, agentProfiles.id))
    .innerJoin(agentUser, eq(agentProfiles.userId, agentUser.id))
    .orderBy(desc(showings.scheduledAt));
}

export async function getShowingsForAgent(agentProfileId: string) {
  const agentUser = await db
    .select({ name: users.name })
    .from(agentProfiles)
    .innerJoin(users, eq(agentProfiles.userId, users.id))
    .where(eq(agentProfiles.id, agentProfileId))
    .limit(1);

  const rows = await db
    .select({
      id: showings.id,
      scheduledAt: showings.scheduledAt,
      durationMinutes: showings.durationMinutes,
      status: showings.status,
      outcomeNotes: showings.outcomeNotes,
      propertyCode: properties.propertyCode,
      location: properties.location,
      calle: properties.calle,
      prospectName: users.name,
      agentId: showings.agentId,
    })
    .from(showings)
    .innerJoin(properties, eq(showings.propertyId, properties.id))
    .innerJoin(prospects, eq(showings.prospectId, prospects.id))
    .innerJoin(users, eq(prospects.userId, users.id))
    .where(eq(showings.agentId, agentProfileId))
    .orderBy(desc(showings.scheduledAt));

  return rows.map((r) => ({
    ...r,
    agentName: agentUser[0]?.name ?? null,
  }));
}

export async function getShowingById(id: string) {
  const [row] = await db
    .select({
      id: showings.id,
      scheduledAt: showings.scheduledAt,
      durationMinutes: showings.durationMinutes,
      status: showings.status,
      outcomeNotes: showings.outcomeNotes,
      propertyId: showings.propertyId,
      propertyCode: properties.propertyCode,
      location: properties.location,
      calle: properties.calle,
      colonia: properties.colonia,
      prospectId: showings.prospectId,
      prospectName: users.name,
      agentId: showings.agentId,
      applicationId: showings.applicationId,
    })
    .from(showings)
    .innerJoin(properties, eq(showings.propertyId, properties.id))
    .innerJoin(prospects, eq(showings.prospectId, prospects.id))
    .innerJoin(users, eq(prospects.userId, users.id))
    .where(eq(showings.id, id))
    .limit(1);

  if (!row) return null;

  const [agent] = await db
    .select({ name: users.name })
    .from(agentProfiles)
    .innerJoin(users, eq(agentProfiles.userId, users.id))
    .where(eq(agentProfiles.id, row.agentId))
    .limit(1);

  return { ...row, agentName: agent?.name ?? null };
}

export async function getAvailabilityBlocks(agentProfileId: string) {
  return db
    .select()
    .from(agentAvailabilityBlocks)
    .where(eq(agentAvailabilityBlocks.agentId, agentProfileId))
    .orderBy(desc(agentAvailabilityBlocks.startAt));
}

export async function getScheduleFormOptions() {
  const [propertyList, prospectList, agentList] = await Promise.all([
    db
      .select({
        id: properties.id,
        propertyCode: properties.propertyCode,
        location: properties.location,
        status: properties.status,
      })
      .from(properties)
      .where(or(eq(properties.status, "available"), eq(properties.status, "occupied")))
      .orderBy(properties.propertyCode),
    db
      .select({
        id: prospects.id,
        name: users.name,
        email: users.email,
      })
      .from(prospects)
      .innerJoin(users, eq(prospects.userId, users.id))
      .orderBy(users.name),
    db
      .select({
        id: agentProfiles.id,
        name: users.name,
      })
      .from(agentProfiles)
      .innerJoin(users, eq(agentProfiles.userId, users.id))
      .where(eq(agentProfiles.isActive, true))
      .orderBy(users.name),
  ]);

  return { properties: propertyList, prospects: prospectList, agents: agentList };
}

export async function getActiveAgents() {
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

export async function getShowingsForProspect(prospectId: string) {
  const agentUser = alias(users, "agent_user");

  return db
    .select({
      id: showings.id,
      scheduledAt: showings.scheduledAt,
      durationMinutes: showings.durationMinutes,
      status: showings.status,
      outcomeNotes: showings.outcomeNotes,
      propertyCode: properties.propertyCode,
      location: properties.location,
      agentName: agentUser.name,
    })
    .from(showings)
    .innerJoin(properties, eq(showings.propertyId, properties.id))
    .innerJoin(agentProfiles, eq(showings.agentId, agentProfiles.id))
    .innerJoin(agentUser, eq(agentProfiles.userId, agentUser.id))
    .where(eq(showings.prospectId, prospectId))
    .orderBy(desc(showings.scheduledAt));
}

export async function getPendingShowingRequests() {
  const prospectUser = alias(users, "prospect_user");
  const agentUser = alias(users, "agent_user");

  return db
    .select({
      id: showings.id,
      scheduledAt: showings.scheduledAt,
      durationMinutes: showings.durationMinutes,
      outcomeNotes: showings.outcomeNotes,
      propertyCode: properties.propertyCode,
      location: properties.location,
      prospectName: prospectUser.name,
      agentName: agentUser.name,
    })
    .from(showings)
    .innerJoin(properties, eq(showings.propertyId, properties.id))
    .innerJoin(prospects, eq(showings.prospectId, prospects.id))
    .innerJoin(prospectUser, eq(prospects.userId, prospectUser.id))
    .innerJoin(agentProfiles, eq(showings.agentId, agentProfiles.id))
    .innerJoin(agentUser, eq(agentProfiles.userId, agentUser.id))
    .where(eq(showings.status, "requested"))
    .orderBy(showings.scheduledAt);
}

export async function findApplicationForShowing(
  prospectId: string,
  propertyId: string
) {
  const [app] = await db
    .select({ id: applications.id, stage: applications.stage })
    .from(applications)
    .where(
      and(
        eq(applications.prospectId, prospectId),
        eq(applications.propertyId, propertyId)
      )
    )
    .limit(1);
  return app ?? null;
}

/** Calendar events for FullCalendar */
export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: "showing" | "block";
    status?: string;
    showingId?: string;
    blockId?: string;
  };
};

const STATUS_COLORS: Record<string, string> = {
  requested: "#f59e0b",
  scheduled: "#0d9488",
  completed: "#059669",
  cancelled: "#64748b",
  no_show: "#e11d48",
};

export function showingsToCalendarEvents(
  items: {
    id: string;
    scheduledAt: Date;
    durationMinutes: number;
    status: string;
    propertyCode: string;
    prospectName: string | null;
  }[]
): CalendarEvent[] {
  return items.map((s) => {
    const start = new Date(s.scheduledAt);
    const end = new Date(start.getTime() + s.durationMinutes * 60 * 1000);
    const color = STATUS_COLORS[s.status] ?? "#3b82f6";
    return {
      id: `showing-${s.id}`,
      title: `${s.propertyCode} · ${s.prospectName ?? "Prospect"}`,
      start: start.toISOString(),
      end: end.toISOString(),
      backgroundColor: color,
      borderColor: color,
      extendedProps: { type: "showing", status: s.status, showingId: s.id },
    };
  });
}

export function blocksToCalendarEvents(
  items: {
    id: string;
    startAt: Date;
    endAt: Date;
    reason: string | null;
    allDay: boolean;
  }[]
): CalendarEvent[] {
  return items.map((b) => ({
    id: `block-${b.id}`,
    title: b.reason ? `Unavailable: ${b.reason}` : "Unavailable",
    start: new Date(b.startAt).toISOString(),
    end: new Date(b.endAt).toISOString(),
    backgroundColor: "#475569",
    borderColor: "#334155",
    extendedProps: { type: "block", blockId: b.id },
  }));
}

export async function getAllShowingsCalendarEvents() {
  const rows = await db
    .select({
      id: showings.id,
      scheduledAt: showings.scheduledAt,
      durationMinutes: showings.durationMinutes,
      status: showings.status,
      propertyCode: properties.propertyCode,
      prospectName: users.name,
    })
    .from(showings)
    .innerJoin(properties, eq(showings.propertyId, properties.id))
    .innerJoin(prospects, eq(showings.prospectId, prospects.id))
    .innerJoin(users, eq(prospects.userId, users.id))
    .orderBy(showings.scheduledAt);

  return showingsToCalendarEvents(rows);
}

export async function getAgentCalendarEvents(agentProfileId: string) {
  const [showingRows, blockRows] = await Promise.all([
    db
      .select({
        id: showings.id,
        scheduledAt: showings.scheduledAt,
        durationMinutes: showings.durationMinutes,
        status: showings.status,
        propertyCode: properties.propertyCode,
        prospectName: users.name,
      })
      .from(showings)
      .innerJoin(properties, eq(showings.propertyId, properties.id))
      .innerJoin(prospects, eq(showings.prospectId, prospects.id))
      .innerJoin(users, eq(prospects.userId, users.id))
      .where(eq(showings.agentId, agentProfileId)),
    getAvailabilityBlocks(agentProfileId),
  ]);

  return [
    ...showingsToCalendarEvents(showingRows),
    ...blocksToCalendarEvents(blockRows),
  ];
}
