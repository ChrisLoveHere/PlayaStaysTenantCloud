import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { getReadNotificationKeys } from "@/lib/queries/notification-reads";
import { getNotificationsForRole } from "@/lib/queries/notifications";
import { markNotificationRead } from "@/lib/queries/notification-reads";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  let agentProfileId: string | undefined;

  if (role === "agent") {
    const profile = await getAgentProfileByUserId(session.user.id);
    if (!profile?.isActive) {
      return NextResponse.json({ items: [], unreadCount: 0 });
    }
    agentProfileId = profile.id;
  }

  const items = await getNotificationsForRole(role, {
    agentProfileId,
    userId: session.user.id,
  });

  const readKeys = await getReadNotificationKeys(session.user.id);
  const unreadCount = items.filter((n) => !readKeys.has(n.id)).length;

  return NextResponse.json({
    items: items.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      read: readKeys.has(n.id),
    })),
    unreadCount,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    notificationKey?: string;
    notificationKeys?: string[];
  };

  if (body.notificationKeys?.length) {
    for (const key of body.notificationKeys) {
      await markNotificationRead(session.user.id, key);
    }
  } else if (body.notificationKey) {
    await markNotificationRead(session.user.id, body.notificationKey);
  }

  return NextResponse.json({ ok: true });
}
