import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";

export async function getRecentAuditLogs(limit = 50) {
  const actor = alias(users, "actor");

  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      summary: auditLogs.summary,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: actor.name,
    })
    .from(auditLogs)
    .leftJoin(actor, eq(auditLogs.actorId, actor.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
