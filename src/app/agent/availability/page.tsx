import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { AvailabilityBlocksList } from "@/components/availability/availability-blocks-list";
import { BlockAvailabilityForm } from "@/components/availability/block-availability-form";
import { ShowingsCalendar } from "@/components/showings/showings-calendar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { agentNav } from "@/lib/pages/placeholder";
import {
  getAgentCalendarEvents,
  getAvailabilityBlocks,
} from "@/lib/queries/showings";

export default async function AgentAvailabilityPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") redirect("/login");

  const profile = await getAgentProfileByUserId(session.user.id);
  if (!profile) redirect("/agent");

  const [blocks, events] = await Promise.all([
    getAvailabilityBlocks(profile.id),
    getAgentCalendarEvents(profile.id),
  ]);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="My Availability"
      navItems={agentNav}
      userName={session.user.name}
    >
      <div className="space-y-8">
        <BlockAvailabilityForm />

        <div>
          <h2 className="mb-3 text-lg font-semibold">Calendar</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Blue = showings · Gray = blocked time
          </p>
          <ShowingsCalendar events={events} height="500px" />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Blocked times</h2>
          <AvailabilityBlocksList blocks={blocks} />
        </div>
      </div>
    </DashboardShell>
  );
}
