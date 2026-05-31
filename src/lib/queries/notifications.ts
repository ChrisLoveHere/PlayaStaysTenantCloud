import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
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

export type InAppNotification = {
  id: string;
  type:
    | "payment_claim"
    | "application"
    | "showing_request"
    | "overdue_rent"
    | "maintenance"
    | "upcoming_showing";
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

export async function getNotificationsForRole(
  role: UserRole,
  agentProfileId?: string
): Promise<InAppNotification[]> {
  if (role === "landlord") return getLandlordNotifications();
  if (role === "agent" && agentProfileId) {
    return getAgentNotifications(agentProfileId);
  }
  return [];
}
