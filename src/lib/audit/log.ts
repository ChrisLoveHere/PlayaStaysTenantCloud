import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import type { AuditAction } from "@/lib/db/schema";

export async function recordAuditLog(input: {
  actorId: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}
