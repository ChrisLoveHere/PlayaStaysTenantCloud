import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  applications,
  maintenanceRequests,
  properties,
  prospects,
  rentPaymentClaims,
  rentPayments,
  showings,
  tenants,
  users,
} from "@/lib/db/schema";
import type { UserRole } from "@/lib/db/schema";
import { applicationStageLabel } from "@/lib/utils/format";

export type InAppNotification = {
  id: string;
  type:
    | "payment_claim"
    | "application"
    | "showing_request"
    | "overdue_rent"
    | "maintenance"
    | "upcoming_showing"
    | "claim_result"
    | "maintenance_update"
    | "showing_confirmed"
    | "application_update";
  title: string;
  message: string;
  href: string;
  createdAt: Date;
};

export async function getLandlordNotifications(): Promise<InAppNotification[]> {
  const items: InAppNotification[] = [];
  const tenantUser = alias(users, "tenant_user");
  const prospectUser = alias(users, "prospect_user");

  const claims = await db
    .select({
      id: rentPaymentClaims.id,
      submittedAt: rentPaymentClaims.submittedAt,
      tenantName: tenantUser.name,
      propertyCode: properties.propertyCode,
    })
    .from(rentPaymentClaims)
    .innerJoin(rentPayments, eq(rentPaymentClaims.rentPaymentId, rentPayments.id))
    .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
    .innerJoin(tenants, eq(rentPaymentClaims.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .where(eq(rentPaymentClaims.status, "pending_review"))
    .orderBy(desc(rentPaymentClaims.submittedAt))
    .limit(10);

  for (const c of claims) {
    items.push({
      id: `claim-${c.id}`,
      type: "payment_claim",
      title: "Payment report to review",
      message: `${c.tenantName ?? "Tenant"} · ${c.propertyCode}`,
      href: "/landlord/rent",
      createdAt: c.submittedAt,
    });
  }

  const newApps = await db
    .select({
      id: applications.id,
      submittedAt: applications.submittedAt,
      updatedAt: applications.updatedAt,
      prospectName: prospectUser.name,
      propertyCode: properties.propertyCode,
    })
    .from(applications)
    .innerJoin(prospects, eq(applications.prospectId, prospects.id))
    .innerJoin(prospectUser, eq(prospects.userId, prospectUser.id))
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .where(inArray(applications.stage, ["applied", "screening"]))
    .orderBy(desc(applications.updatedAt))
    .limit(10);

  for (const app of newApps) {
    items.push({
      id: `app-${app.id}`,
      type: "application",
      title: "Application needs review",
      message: `${app.prospectName ?? "Prospect"} · ${app.propertyCode}`,
      href: `/landlord/prospects/${app.id}`,
      createdAt: app.submittedAt ?? app.updatedAt,
    });
  }

  const showingRequests = await db
    .select({
      id: showings.id,
      scheduledAt: showings.scheduledAt,
      prospectName: prospectUser.name,
      propertyCode: properties.propertyCode,
    })
    .from(showings)
    .innerJoin(prospects, eq(showings.prospectId, prospects.id))
    .innerJoin(prospectUser, eq(prospects.userId, prospectUser.id))
    .innerJoin(properties, eq(showings.propertyId, properties.id))
    .where(eq(showings.status, "requested"))
    .orderBy(showings.scheduledAt)
    .limit(10);

  for (const s of showingRequests) {
    items.push({
      id: `showing-${s.id}`,
      type: "showing_request",
      title: "Showing request",
      message: `${s.prospectName ?? "Prospect"} · ${s.propertyCode}`,
      href: "/landlord/showings",
      createdAt: s.scheduledAt,
    });
  }

  const overdue = await db
    .select({
      id: rentPayments.id,
      dueDate: rentPayments.dueDate,
      tenantName: tenantUser.name,
      propertyCode: properties.propertyCode,
    })
    .from(rentPayments)
    .innerJoin(tenants, eq(rentPayments.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
    .where(eq(rentPayments.status, "overdue"))
    .orderBy(rentPayments.dueDate)
    .limit(10);

  for (const p of overdue) {
    items.push({
      id: `overdue-${p.id}`,
      type: "overdue_rent",
      title: "Overdue rent",
      message: `${p.tenantName ?? "Tenant"} · ${p.propertyCode}`,
      href: "/landlord/rent",
      createdAt: p.dueDate,
    });
  }

  const openMaint = await db
    .select({
      id: maintenanceRequests.id,
      submittedAt: maintenanceRequests.submittedAt,
      title: maintenanceRequests.title,
      tenantName: tenantUser.name,
    })
    .from(maintenanceRequests)
    .innerJoin(tenants, eq(maintenanceRequests.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .where(inArray(maintenanceRequests.status, ["open", "in_progress"]))
    .orderBy(desc(maintenanceRequests.submittedAt))
    .limit(10);

  for (const m of openMaint) {
    items.push({
      id: `maint-${m.id}`,
      type: "maintenance",
      title: "Open maintenance",
      message: `${m.title} · ${m.tenantName ?? "Tenant"}`,
      href: "/landlord/maintenance",
      createdAt: m.submittedAt,
    });
  }

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getAgentNotifications(
  agentProfileId: string
): Promise<InAppNotification[]> {
  const items: InAppNotification[] = [];
  const prospectUser = alias(users, "prospect_user");
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 28 * 60 * 60 * 1000);
  const soon = new Date(now.getTime() + 20 * 60 * 60 * 1000);

  const upcomingShowings = await db
    .select({
      id: showings.id,
      scheduledAt: showings.scheduledAt,
      propertyCode: properties.propertyCode,
      prospectName: prospectUser.name,
    })
    .from(showings)
    .innerJoin(prospects, eq(showings.prospectId, prospects.id))
    .innerJoin(prospectUser, eq(prospects.userId, prospectUser.id))
    .innerJoin(properties, eq(showings.propertyId, properties.id))
    .where(
      and(
        eq(showings.agentId, agentProfileId),
        eq(showings.status, "scheduled"),
        gte(showings.scheduledAt, soon),
        lte(showings.scheduledAt, tomorrow)
      )
    )
    .orderBy(showings.scheduledAt)
    .limit(10);

  for (const s of upcomingShowings) {
    items.push({
      id: `showing-${s.id}`,
      type: "upcoming_showing",
      title: "Showing tomorrow",
      message: `${s.propertyCode} · ${s.prospectName ?? "Prospect"}`,
      href: "/agent/showings",
      createdAt: s.scheduledAt,
    });
  }

  const assignedApps = await db
    .select({
      id: applications.id,
      updatedAt: applications.updatedAt,
      prospectName: prospectUser.name,
      propertyCode: properties.propertyCode,
    })
    .from(applications)
    .innerJoin(prospects, eq(applications.prospectId, prospects.id))
    .innerJoin(prospectUser, eq(prospects.userId, prospectUser.id))
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .where(
      and(
        eq(applications.assignedAgentId, agentProfileId),
        inArray(applications.stage, ["applied", "screening", "property_viewed"])
      )
    )
    .orderBy(desc(applications.updatedAt))
    .limit(10);

  for (const app of assignedApps) {
    items.push({
      id: `app-${app.id}`,
      type: "application",
      title: "Assigned prospect",
      message: `${app.prospectName ?? "Prospect"} · ${app.propertyCode}`,
      href: `/agent/prospects/${app.id}`,
      createdAt: app.updatedAt,
    });
  }

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getTenantNotifications(userId: string): Promise<InAppNotification[]> {
  const items: InAppNotification[] = [];

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.userId, userId))
    .limit(1);

  if (!tenant) return [];

  const claimResults = await db
    .select({
      id: rentPaymentClaims.id,
      status: rentPaymentClaims.status,
      reviewedAt: rentPaymentClaims.reviewedAt,
      landlordNotes: rentPaymentClaims.landlordNotes,
      propertyCode: properties.propertyCode,
    })
    .from(rentPaymentClaims)
    .innerJoin(rentPayments, eq(rentPaymentClaims.rentPaymentId, rentPayments.id))
    .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
    .where(
      and(
        eq(rentPaymentClaims.tenantId, tenant.id),
        inArray(rentPaymentClaims.status, ["approved", "rejected"])
      )
    )
    .orderBy(desc(rentPaymentClaims.reviewedAt))
    .limit(5);

  for (const c of claimResults) {
    if (!c.reviewedAt) continue;
    items.push({
      id: `claim-result-${c.id}`,
      type: "claim_result",
      title:
        c.status === "approved" ? "Payment confirmed" : "Payment report declined",
      message:
        c.status === "approved"
          ? `Your SPEI payment for ${c.propertyCode} was confirmed`
          : c.landlordNotes ?? `Payment report for ${c.propertyCode} was declined`,
      href: "/portal/payments",
      createdAt: c.reviewedAt,
    });
  }

  const activeMaint = await db
    .select({
      id: maintenanceRequests.id,
      title: maintenanceRequests.title,
      status: maintenanceRequests.status,
      submittedAt: maintenanceRequests.submittedAt,
    })
    .from(maintenanceRequests)
    .where(
      and(
        eq(maintenanceRequests.tenantId, tenant.id),
        inArray(maintenanceRequests.status, ["in_progress", "resolved"])
      )
    )
    .orderBy(desc(maintenanceRequests.submittedAt))
    .limit(5);

  for (const m of activeMaint) {
    items.push({
      id: `maint-update-${m.id}-${m.status}`,
      type: "maintenance_update",
      title:
        m.status === "resolved" ? "Maintenance resolved" : "Maintenance in progress",
      message: m.title,
      href: "/portal/maintenance",
      createdAt: m.submittedAt,
    });
  }

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getProspectNotifications(
  userId: string
): Promise<InAppNotification[]> {
  const items: InAppNotification[] = [];

  const [prospect] = await db
    .select({ id: prospects.id })
    .from(prospects)
    .where(eq(prospects.userId, userId))
    .limit(1);

  if (!prospect) return [];

  const apps = await db
    .select({
      id: applications.id,
      stage: applications.stage,
      updatedAt: applications.updatedAt,
      propertyCode: properties.propertyCode,
    })
    .from(applications)
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .where(
      and(
        eq(applications.prospectId, prospect.id),
        sql`${applications.stage} not in ('rejected', 'new')`
      )
    )
    .orderBy(desc(applications.updatedAt))
    .limit(5);

  for (const app of apps) {
    items.push({
      id: `app-update-${app.id}`,
      type: "application_update",
      title: "Application update",
      message: `${app.propertyCode} · ${applicationStageLabel(app.stage)}`,
      href: "/portal/application",
      createdAt: app.updatedAt,
    });
  }

  const now = new Date();
  const upcomingShowings = await db
    .select({
      id: showings.id,
      scheduledAt: showings.scheduledAt,
      propertyCode: properties.propertyCode,
      status: showings.status,
    })
    .from(showings)
    .innerJoin(properties, eq(showings.propertyId, properties.id))
    .where(
      and(
        eq(showings.prospectId, prospect.id),
        eq(showings.status, "scheduled"),
        gte(showings.scheduledAt, now)
      )
    )
    .orderBy(showings.scheduledAt)
    .limit(5);

  for (const s of upcomingShowings) {
    items.push({
      id: `showing-${s.id}`,
      type: "showing_confirmed",
      title: "Upcoming showing",
      message: `${s.propertyCode} · ${s.scheduledAt.toLocaleString("en-US")}`,
      href: "/portal/properties",
      createdAt: s.scheduledAt,
    });
  }

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getNotificationsForRole(
  role: UserRole,
  options?: { agentProfileId?: string; userId?: string }
): Promise<InAppNotification[]> {
  if (role === "landlord") return getLandlordNotifications();
  if (role === "agent" && options?.agentProfileId) {
    return getAgentNotifications(options.agentProfileId);
  }
  if (role === "tenant" && options?.userId) {
    return getTenantNotifications(options.userId);
  }
  if (role === "prospect" && options?.userId) {
    return getProspectNotifications(options.userId);
  }
  return [];
}
