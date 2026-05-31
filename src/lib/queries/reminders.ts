import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  applications,
  commissions,
  leases,
  notificationLog,
  properties,
  prospects,
  rentPayments,
  showings,
  tenants,
  users,
  agentProfiles,
} from "@/lib/db/schema";
import type { NotificationType } from "@/lib/db/schema";
import { getLandlordNotifyEmail } from "@/lib/queries/settings";

export async function getLandlordEmail(): Promise<string | null> {
  return getLandlordNotifyEmail();
}

export async function wasNotificationSent(
  type: NotificationType,
  entityId: string
) {
  const [row] = await db
    .select({ id: notificationLog.id })
    .from(notificationLog)
    .where(
      and(
        eq(notificationLog.type, type),
        eq(notificationLog.entityId, entityId)
      )
    )
    .limit(1);

  return Boolean(row);
}

export async function wasNotificationSentSince(
  type: NotificationType,
  entityId: string,
  since: Date
) {
  const [row] = await db
    .select({ id: notificationLog.id })
    .from(notificationLog)
    .where(
      and(
        eq(notificationLog.type, type),
        eq(notificationLog.entityId, entityId),
        gte(notificationLog.sentAt, since)
      )
    )
    .limit(1);

  return Boolean(row);
}

export async function logNotification(
  type: NotificationType,
  entityType: string,
  entityId: string
) {
  await db.insert(notificationLog).values({ type, entityType, entityId });
}

export async function markOverdueRentPayments() {
  const now = new Date();
  const result = await db
    .update(rentPayments)
    .set({ status: "overdue", updatedAt: now })
    .where(
      and(
        eq(rentPayments.status, "pending"),
        lte(rentPayments.dueDate, now)
      )
    )
    .returning({ id: rentPayments.id });

  return result.length;
}

export async function getOverduePaymentsForEmail() {
  const tenantUser = alias(users, "tenant_user");

  return db
    .select({
      id: rentPayments.id,
      amount: rentPayments.amount,
      dueDate: rentPayments.dueDate,
      tenantName: tenantUser.name,
      tenantEmail: tenantUser.email,
      propertyCode: properties.propertyCode,
    })
    .from(rentPayments)
    .innerJoin(tenants, eq(rentPayments.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
    .where(eq(rentPayments.status, "overdue"));
}

export async function getLeasesForRenewalReminder(daysUntilEnd: 60 | 30) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysUntilEnd - 1);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() + daysUntilEnd);

  const tenantUser = alias(users, "tenant_user");

  return db
    .select({
      id: leases.id,
      endDate: leases.endDate,
      propertyCode: properties.propertyCode,
      tenantName: tenantUser.name,
      tenantEmail: tenantUser.email,
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .innerJoin(tenants, eq(leases.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .where(
      and(
        eq(leases.status, "signed"),
        gte(leases.endDate, start),
        lte(leases.endDate, end)
      )
    );
}

export async function getUpcomingLeaseRenewals(daysAhead = 60) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + daysAhead);

  const tenantUser = alias(users, "tenant_user");

  return db
    .select({
      id: leases.id,
      endDate: leases.endDate,
      propertyCode: properties.propertyCode,
      location: properties.location,
      tenantName: tenantUser.name,
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .innerJoin(tenants, eq(leases.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .where(
      and(
        eq(leases.status, "signed"),
        gte(leases.endDate, now),
        lte(leases.endDate, cutoff)
      )
    )
    .orderBy(leases.endDate);
}

export async function getShowingsFor24hReminder() {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000);

  const prospectUser = alias(users, "prospect_user");
  const agentUser = alias(users, "agent_user");

  return db
    .select({
      id: showings.id,
      scheduledAt: showings.scheduledAt,
      propertyCode: properties.propertyCode,
      prospectName: prospectUser.name,
      prospectEmail: prospectUser.email,
      agentName: agentUser.name,
      agentEmail: agentUser.email,
    })
    .from(showings)
    .innerJoin(properties, eq(showings.propertyId, properties.id))
    .innerJoin(prospects, eq(showings.prospectId, prospects.id))
    .innerJoin(prospectUser, eq(prospects.userId, prospectUser.id))
    .innerJoin(agentProfiles, eq(showings.agentId, agentProfiles.id))
    .innerJoin(agentUser, eq(agentProfiles.userId, agentUser.id))
    .where(
      and(
        eq(showings.status, "scheduled"),
        gte(showings.scheduledAt, windowStart),
        lte(showings.scheduledAt, windowEnd)
      )
    );
}

export async function getAgentDashboardStats(agentProfileId: string) {
  const now = new Date();

  const [[showingStats], [prospectStats], [commissionStats]] = await Promise.all([
    db
      .select({ count: count() })
      .from(showings)
      .where(
        and(
          eq(showings.agentId, agentProfileId),
          eq(showings.status, "scheduled"),
          gte(showings.scheduledAt, now)
        )
      ),
    db
      .select({ count: count() })
      .from(applications)
      .where(
        and(
          eq(applications.assignedAgentId, agentProfileId),
          sql`${applications.stage} not in ('rejected', 'moved_in')`
        )
      ),
    db
      .select({
        total: sql<number>`coalesce(sum(${commissions.amount}), 0)::int`,
      })
      .from(commissions)
      .where(
        and(
          eq(commissions.agentId, agentProfileId),
          eq(commissions.status, "pending")
        )
      ),
  ]);

  return {
    upcomingShowings: showingStats?.count ?? 0,
    activeProspects: prospectStats?.count ?? 0,
    pendingCommission: Number(commissionStats?.total ?? 0),
  };
}
