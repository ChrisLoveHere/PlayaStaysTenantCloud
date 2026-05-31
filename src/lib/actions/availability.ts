"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { agentAvailabilityBlocks } from "@/lib/db/schema";
import { availabilityBlockSchema } from "@/lib/validations/showing";

export type AvailabilityActionState = {
  error?: string;
  success?: string;
};

export async function blockAvailability(
  _prev: AvailabilityActionState,
  formData: FormData
): Promise<AvailabilityActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") {
    return { error: "Unauthorized." };
  }

  const profile = await getAgentProfileByUserId(session.user.id);
  if (!profile?.isActive) return { error: "Account not approved." };

  const parsed = availabilityBlockSchema.safeParse({
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    reason: formData.get("reason") || undefined,
    allDay: formData.get("allDay") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please provide start and end times." };
  }

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return { error: "Invalid dates." };
  }
  if (endAt <= startAt) {
    return { error: "End time must be after start time." };
  }

  await db.insert(agentAvailabilityBlocks).values({
    agentId: profile.id,
    startAt,
    endAt,
    reason: parsed.data.reason?.trim() || null,
    allDay: parsed.data.allDay === "on",
  });

  revalidatePath("/agent/availability");
  revalidatePath("/agent/showings");
  return { success: "Unavailable time blocked." };
}

export async function removeAvailabilityBlock(blockId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") {
    throw new Error("Forbidden");
  }

  const profile = await getAgentProfileByUserId(session.user.id);
  if (!profile) throw new Error("Forbidden");

  await db
    .delete(agentAvailabilityBlocks)
    .where(
      and(
        eq(agentAvailabilityBlocks.id, blockId),
        eq(agentAvailabilityBlocks.agentId, profile.id)
      )
    );

  revalidatePath("/agent/availability");
  revalidatePath("/agent/showings");
}
