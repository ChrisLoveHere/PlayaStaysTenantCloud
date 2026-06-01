"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import {
  AGENT_PIPELINE_STAGES,
  columnIdToTargetStage,
  type PipelineColumnId,
} from "@/lib/constants/pipeline";
import { db } from "@/lib/db";
import { applications, properties, prospects, users } from "@/lib/db/schema";
import type { ApplicationStage } from "@/lib/db/schema";
import { recordStageChangeInternal } from "@/lib/actions/application-stage";
import { notifyProspectStageChange } from "@/lib/email/notifications";
import { getPipelineDealDetail } from "@/lib/queries/pipeline";

export type PipelineActionState = {
  error?: string;
  success?: string;
};

async function assertCanManageApplication(
  applicationId: string,
  role: "landlord" | "agent",
  userId: string
) {
  const [row] = await db
    .select({
      assignedAgentId: applications.assignedAgentId,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!row) return { error: "Deal not found." as const };

  if (role === "agent") {
    const profile = await getAgentProfileByUserId(userId);
    if (!profile?.isActive) return { error: "Forbidden." as const };
    if (row.assignedAgentId !== profile.id) {
      return { error: "You are not assigned to this deal." as const };
    }
  }

  return { ok: true as const };
}

function revalidatePipelinePaths() {
  revalidatePath("/landlord/pipeline");
  revalidatePath("/agent/pipeline");
  revalidatePath("/landlord/prospects");
  revalidatePath("/agent/prospects");
}

export async function movePipelineDeal(
  applicationId: string,
  columnId: PipelineColumnId
): Promise<PipelineActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const role = session.user.role;
  if (role !== "landlord" && role !== "agent") {
    return { error: "Forbidden." };
  }

  const access = await assertCanManageApplication(
    applicationId,
    role,
    session.user.id
  );
  if ("error" in access) return { error: access.error };

  const newStage = columnIdToTargetStage(columnId);

  if (role === "agent" && !AGENT_PIPELINE_STAGES.includes(newStage)) {
    return { error: "You cannot move deals to this stage." };
  }

  const [current] = await db
    .select({ stage: applications.stage })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!current) return { error: "Deal not found." };
  if (current.stage === newStage) return { success: "Already in this stage." };

  await db
    .update(applications)
    .set({ stage: newStage, updatedAt: new Date() })
    .where(eq(applications.id, applicationId));

  await recordStageChangeInternal(
    applicationId,
    current.stage,
    newStage,
    session.user.id
  );

  const [meta] = await db
    .select({
      propertyCode: properties.propertyCode,
      prospectName: users.name,
      prospectEmail: users.email,
    })
    .from(applications)
    .innerJoin(properties, eq(applications.propertyId, properties.id))
    .innerJoin(prospects, eq(applications.prospectId, prospects.id))
    .innerJoin(users, eq(prospects.userId, users.id))
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (meta?.prospectEmail) {
    try {
      await notifyProspectStageChange({
        prospectEmail: meta.prospectEmail,
        prospectName: meta.prospectName ?? "Prospect",
        propertyCode: meta.propertyCode,
        stage: newStage,
      });
    } catch (err) {
      console.error("[pipeline stage email]", err);
    }
  }

  revalidatePipelinePaths();
  revalidatePath(`/landlord/prospects/${applicationId}`);
  revalidatePath(`/agent/prospects/${applicationId}`);
  revalidatePath("/portal/application");

  return { success: "Deal moved." };
}

export async function assignPipelineAgent(
  applicationId: string,
  agentId: string | null
): Promise<PipelineActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    return { error: "Forbidden." };
  }

  const [app] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!app) return { error: "Deal not found." };

  await db
    .update(applications)
    .set({
      assignedAgentId: agentId || null,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId));

  revalidatePipelinePaths();
  revalidatePath(`/landlord/prospects/${applicationId}`);

  return { success: agentId ? "Agent assigned." : "Agent unassigned." };
}

export async function fetchPipelineDealDetailAction(dealId: string) {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "landlord" && session.user.role !== "agent") {
    return null;
  }
  return getPipelineDealDetail(dealId);
}
