import { db } from "@/lib/db";
import { applicationStageHistory } from "@/lib/db/schema";
import type { ApplicationStage } from "@/lib/db/schema";
import { recordAuditLog } from "@/lib/audit/log";

export async function recordStageChangeInternal(
  applicationId: string,
  fromStage: ApplicationStage | null,
  toStage: ApplicationStage,
  changedById: string,
  notes?: string
) {
  await db.insert(applicationStageHistory).values({
    applicationId,
    fromStage,
    toStage,
    changedById,
    notes,
  });

  await recordAuditLog({
    actorId: changedById,
    action: "application.stage_changed",
    entityType: "application",
    entityId: applicationId,
    summary: `Application stage changed from ${fromStage ?? "new"} to ${toStage}`,
    metadata: { fromStage, toStage, notes: notes ?? null },
  });
}
