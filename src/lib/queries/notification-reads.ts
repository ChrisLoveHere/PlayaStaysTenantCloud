import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificationReads } from "@/lib/db/schema";

export async function getReadNotificationKeys(userId: string) {
  const rows = await db
    .select({ notificationKey: notificationReads.notificationKey })
    .from(notificationReads)
    .where(eq(notificationReads.userId, userId));
  return new Set(rows.map((r) => r.notificationKey));
}

export async function markNotificationRead(userId: string, notificationKey: string) {
  await db
    .insert(notificationReads)
    .values({ userId, notificationKey })
    .onConflictDoNothing({
      target: [notificationReads.userId, notificationReads.notificationKey],
    });
}

export async function markAllNotificationsRead(
  userId: string,
  notificationKeys: string[]
) {
  if (notificationKeys.length === 0) return;

  for (const key of notificationKeys) {
    await db
      .insert(notificationReads)
      .values({ userId, notificationKey: key })
      .onConflictDoNothing({
        target: [notificationReads.userId, notificationReads.notificationKey],
      });
  }
}

export async function clearReadNotifications(userId: string, keys: string[]) {
  if (keys.length === 0) return;
  await db
    .delete(notificationReads)
    .where(
      and(
        eq(notificationReads.userId, userId),
        inArray(notificationReads.notificationKey, keys)
      )
    );
}
