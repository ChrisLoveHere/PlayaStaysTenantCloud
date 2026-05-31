"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { agentProfiles, prospects, users } from "@/lib/db/schema";
import type { UserRole } from "@/lib/db/schema";

export type RegisterState = {
  error?: string;
  success?: boolean;
};

export async function registerUser(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as UserRole) ?? "prospect";
  const phone = (formData.get("phone") as string)?.trim();

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role, phone })
    .returning({ id: users.id, role: users.role });

  if (role === "prospect" && user) {
    await db.insert(prospects).values({ userId: user.id });
  }

  if (role === "agent" && user) {
    await db.insert(agentProfiles).values({ userId: user.id });
  }

  redirect("/login?registered=1");
}
