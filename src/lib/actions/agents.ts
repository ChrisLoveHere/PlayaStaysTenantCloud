"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { agentProfiles, users } from "@/lib/db/schema";

async function requireLandlord() {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function approveAgent(agentProfileId: string) {
  await requireLandlord();

  await db
    .update(agentProfiles)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(agentProfiles.id, agentProfileId));

  revalidatePath("/landlord/agents");
}

export async function rejectAgent(agentProfileId: string) {
  await requireLandlord();

  const [profile] = await db
    .select({ userId: agentProfiles.userId })
    .from(agentProfiles)
    .where(eq(agentProfiles.id, agentProfileId))
    .limit(1);

  if (!profile) return;

  await db.delete(agentProfiles).where(eq(agentProfiles.id, agentProfileId));
  await db.delete(users).where(eq(users.id, profile.userId));

  revalidatePath("/landlord/agents");
}

export async function getAgentsForLandlord() {
  await requireLandlord();

  return db
    .select({
      id: agentProfiles.id,
      isActive: agentProfiles.isActive,
      commissionType: agentProfiles.commissionType,
      commissionRate: agentProfiles.commissionRate,
      bio: agentProfiles.bio,
      createdAt: agentProfiles.createdAt,
      userId: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
    })
    .from(agentProfiles)
    .innerJoin(users, eq(agentProfiles.userId, users.id))
    .orderBy(agentProfiles.createdAt);
}
