import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agentProfiles,
  applications,
  leases,
  maintenanceRequests,
  prospects,
  tenants,
} from "@/lib/db/schema";
import type { DocumentEntityType, UserRole } from "@/lib/db/schema";

type AccessSession = {
  user: { id: string; role: UserRole };
};

export async function assertDocumentAccess(
  session: AccessSession,
  entityType: DocumentEntityType,
  entityId: string,
  mode: "read" | "write"
): Promise<void> {
  const { role, id: userId } = session.user;

  if (role === "landlord") return;

  switch (entityType) {
    case "property":
      throw new Error("Forbidden");

    case "lease": {
      const [lease] = await db
        .select({
          tenantUserId: tenants.userId,
          assignedAgentId: tenants.assignedAgentId,
        })
        .from(leases)
        .innerJoin(tenants, eq(leases.tenantId, tenants.id))
        .where(eq(leases.id, entityId))
        .limit(1);

      if (!lease) throw new Error("Not found");

      if (role === "tenant" && lease.tenantUserId === userId) {
        if (mode === "read") return;
        throw new Error("Forbidden");
      }

      if (role === "prospect" && lease.tenantUserId === userId && mode === "read") {
        return;
      }

      if (role === "agent" && mode === "read" && lease.assignedAgentId) {
        const [agent] = await db
          .select({ id: agentProfiles.id })
          .from(agentProfiles)
          .where(
            and(
              eq(agentProfiles.userId, userId),
              eq(agentProfiles.id, lease.assignedAgentId)
            )
          )
          .limit(1);
        if (agent) return;
      }

      throw new Error("Forbidden");
    }

    case "application": {
      const [app] = await db
        .select({
          prospectUserId: prospects.userId,
          assignedAgentId: applications.assignedAgentId,
        })
        .from(applications)
        .innerJoin(prospects, eq(applications.prospectId, prospects.id))
        .where(eq(applications.id, entityId))
        .limit(1);

      if (!app) throw new Error("Not found");

      if (role === "prospect" && app.prospectUserId === userId) return;

      if (role === "agent" && app.assignedAgentId) {
        const [agent] = await db
          .select({ id: agentProfiles.id })
          .from(agentProfiles)
          .where(
            and(
              eq(agentProfiles.userId, userId),
              eq(agentProfiles.id, app.assignedAgentId)
            )
          )
          .limit(1);
        if (agent) return;
      }

      throw new Error("Forbidden");
    }

    case "maintenance_request": {
      const [req] = await db
        .select({ tenantUserId: tenants.userId })
        .from(maintenanceRequests)
        .innerJoin(tenants, eq(maintenanceRequests.tenantId, tenants.id))
        .where(eq(maintenanceRequests.id, entityId))
        .limit(1);

      if (!req) throw new Error("Not found");

      if (role === "tenant" && req.tenantUserId === userId) return;

      throw new Error("Forbidden");
    }

    case "move_checklist":
      throw new Error("Forbidden");

    case "prospect": {
      const [prospect] = await db
        .select({ userId: prospects.userId })
        .from(prospects)
        .where(eq(prospects.id, entityId))
        .limit(1);

      if (!prospect) throw new Error("Not found");

      if (role === "prospect" && prospect.userId === userId) return;

      throw new Error("Forbidden");
    }

    default:
      throw new Error("Forbidden");
  }
}
