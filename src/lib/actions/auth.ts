"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
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
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as UserRole) ?? "prospect";
  const phone = (formData.get("phone") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim();

  const displayName =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : name;

  if ((!displayName && !firstName) || !email || !password) {
    return { error: "All required fields must be filled in." };
  }
  if (role === "prospect" && !phone) {
    return { error: "Phone number is required." };
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
    .values({
      name: displayName,
      email,
      passwordHash,
      role,
      phone: phone || null,
    })
    .returning({ id: users.id, role: users.role });

  if (role === "prospect" && user) {
    await db.insert(prospects).values({
      userId: user.id,
      firstName: firstName || displayName?.split(/\s+/)[0] || null,
      lastName:
        lastName ||
        (displayName?.includes(" ")
          ? displayName.split(/\s+/).slice(1).join(" ")
          : null),
    });
    redirect("/login?registered=1");
  }

  if (role === "agent" && user) {
    await db.insert(agentProfiles).values({
      userId: user.id,
      bio: bio || null,
      isActive: false,
    });
    return {
      success: true,
    };
  }

  redirect("/login?registered=1");
}
