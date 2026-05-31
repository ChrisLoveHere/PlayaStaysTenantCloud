import { auth } from "@/auth";
import type { UserRole } from "@/lib/db/schema";

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(allowed: UserRole[]) {
  const session = await requireAuth();
  const role = session.user.role as UserRole;
  if (!allowed.includes(role)) {
    throw new Error("Forbidden");
  }
  return session;
}
