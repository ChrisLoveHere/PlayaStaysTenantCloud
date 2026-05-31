"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { commissions } from "@/lib/db/schema";

export async function markCommissionPaid(commissionId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    throw new Error("Forbidden");
  }

  await db
    .update(commissions)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(commissions.id, commissionId));

  revalidatePath("/landlord/commissions");
  revalidatePath("/agent/commissions");
}
