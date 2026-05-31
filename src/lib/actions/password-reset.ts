"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { sendEmail, isEmailConfigured } from "@/lib/email/client";
import { passwordResetEmail } from "@/lib/email/templates";

export type PasswordResetState = {
  error?: string;
  success?: string;
};

const RESET_EXPIRY_MS = 60 * 60 * 1000;

function resetIdentifier(email: string) {
  return `password-reset:${email.toLowerCase()}`;
}

export async function requestPasswordReset(
  _prev: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Always show success to avoid email enumeration
  const successMessage =
    "If an account exists for that email, we sent a reset link.";

  if (!user?.passwordHash) {
    return { success: successMessage };
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + RESET_EXPIRY_MS);
  const identifier = resetIdentifier(email);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));

  await db.insert(verificationTokens).values({
    identifier,
    token,
    expires,
  });

  if (isEmailConfigured()) {
    const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const mail = passwordResetEmail({
      name: user.name ?? "there",
      resetUrl,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: mail.subject,
        html: mail.html,
      });
    } catch (err) {
      console.error("[password reset email]", err);
      return {
        error: "Could not send reset email. Try again later or contact support.",
      };
    }
  } else if (process.env.NODE_ENV === "development") {
    console.info("[password reset]", `${process.env.AUTH_URL ?? "http://localhost:3000"}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
  }

  return { success: successMessage };
}

export async function resetPassword(
  _prev: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const token = (formData.get("token") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (!email || !token) return { error: "Invalid reset link." };
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const identifier = resetIdentifier(email);
  const [stored] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier))
    .limit(1);

  if (!stored || stored.token !== token || stored.expires < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) return { error: "Account not found." };

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, identifier));

  redirect("/login?reset=1");
}
