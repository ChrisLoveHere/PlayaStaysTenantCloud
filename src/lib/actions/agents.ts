"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { agentProfiles, users } from "@/lib/db/schema";
import {
  createAgentSchema,
  updateAgentSchema,
} from "@/lib/validations/agent";

export type AgentActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

async function requireLandlord() {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    throw new Error("Forbidden");
  }
  return session;
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

export async function getAgentByIdForLandlord(agentProfileId: string) {
  await requireLandlord();

  const [row] = await db
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
    .where(eq(agentProfiles.id, agentProfileId))
    .limit(1);

  return row ?? null;
}

export async function createAgentByLandlord(
  _prev: AgentActionState,
  formData: FormData
): Promise<AgentActionState> {
  await requireLandlord();

  const parsed = createAgentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    commissionType: formData.get("commissionType") || "percent",
    commissionRate: formData.get("commissionRate"),
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const email = data.email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const rate = parseInt(data.commissionRate, 10);
  if (Number.isNaN(rate) || rate < 0) {
    return { error: "Invalid commission rate." };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const [user] = await db
    .insert(users)
    .values({
      name: data.name.trim(),
      email,
      phone: data.phone?.trim() || null,
      passwordHash,
      role: "agent",
    })
    .returning({ id: users.id });

  if (!user) return { error: "Failed to create agent." };

  const [profile] = await db
    .insert(agentProfiles)
    .values({
      userId: user.id,
      bio: data.bio?.trim() || null,
      commissionType: data.commissionType,
      commissionRate: rate,
      isActive: true,
    })
    .returning({ id: agentProfiles.id });

  revalidatePath("/landlord/agents");
  redirect(`/landlord/agents/${profile?.id}`);
}

export async function updateAgentProfile(
  agentProfileId: string,
  _prev: AgentActionState,
  formData: FormData
): Promise<AgentActionState> {
  await requireLandlord();

  const parsed = updateAgentSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    commissionType: formData.get("commissionType"),
    commissionRate: formData.get("commissionRate"),
    bio: formData.get("bio") || undefined,
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const rate = parseInt(data.commissionRate, 10);
  if (Number.isNaN(rate) || rate < 0) {
    return { error: "Invalid commission rate." };
  }

  const [profile] = await db
    .select({ userId: agentProfiles.userId })
    .from(agentProfiles)
    .where(eq(agentProfiles.id, agentProfileId))
    .limit(1);

  if (!profile) return { error: "Agent not found." };

  await db
    .update(users)
    .set({
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, profile.userId));

  await db
    .update(agentProfiles)
    .set({
      bio: data.bio?.trim() || null,
      commissionType: data.commissionType,
      commissionRate: rate,
      isActive: data.isActive === "true",
      updatedAt: new Date(),
    })
    .where(eq(agentProfiles.id, agentProfileId));

  revalidatePath("/landlord/agents");
  revalidatePath(`/landlord/agents/${agentProfileId}`);
  return { success: "Agent profile updated." };
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

export async function deactivateAgent(agentProfileId: string) {
  await requireLandlord();

  await db
    .update(agentProfiles)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(agentProfiles.id, agentProfileId));

  revalidatePath("/landlord/agents");
  revalidatePath(`/landlord/agents/${agentProfileId}`);
}
