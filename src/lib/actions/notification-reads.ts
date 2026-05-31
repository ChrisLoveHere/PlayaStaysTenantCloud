"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/queries/notification-reads";

export async function markNotificationAsRead(notificationKey: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  await markNotificationRead(session.user.id, notificationKey);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function markAllNotificationsAsRead(notificationKeys: string[]) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  await markAllNotificationsRead(session.user.id, notificationKeys);
  revalidatePath("/", "layout");
  return { success: true };
}
