import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentProfiles } from "@/lib/db/schema";

export async function getAgentProfileByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(agentProfiles)
    .where(eq(agentProfiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

export async function isAgentApproved(userId: string): Promise<boolean> {
  const profile = await getAgentProfileByUserId(userId);
  return profile?.isActive ?? false;
}
