import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { getNotificationsForRole } from "@/lib/queries/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "landlord" && role !== "agent") {
    return NextResponse.json({ items: [] });
  }

  let agentProfileId: string | undefined;
  if (role === "agent") {
    const profile = await getAgentProfileByUserId(session.user.id);
    if (!profile?.isActive) {
      return NextResponse.json({ items: [] });
    }
    agentProfileId = profile.id;
  }

  const items = await getNotificationsForRole(role, agentProfileId);

  return NextResponse.json({
    items: items.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}
