import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { ShowingOutcomeForm } from "@/components/showings/showing-outcome-form";
import { ShowingsCalendar } from "@/components/showings/showings-calendar";
import { ShowingsTable } from "@/components/showings/showings-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agentNav } from "@/lib/pages/placeholder";
import {
  getAgentCalendarEvents,
  getShowingsForAgent,
} from "@/lib/queries/showings";
import { getLocationLabel } from "@/lib/constants/locations";
import { showingStatusLabel } from "@/lib/utils/format";

export default async function AgentShowingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") redirect("/login");

  const profile = await getAgentProfileByUserId(session.user.id);
  if (!profile) redirect("/agent");

  const [showings, events] = await Promise.all([
    getShowingsForAgent(profile.id),
    getAgentCalendarEvents(profile.id),
  ]);

  const upcoming = showings.filter((s) => s.status === "scheduled");

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="My Showings"
      navItems={agentNav}
      userName={session.user.name}
    >
      <div className="space-y-8">
        <ShowingsCalendar events={events} height="500px" />

        {upcoming.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Upcoming — mark outcome</h2>
            {upcoming.map((s) => (
              <div key={s.id} className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-mono">
                      {s.propertyCode}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>
                      {new Date(s.scheduledAt).toLocaleString("en-US", {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="text-muted-foreground">
                      {getLocationLabel(s.location)} · {s.calle}
                    </p>
                    <p>Prospect: {s.prospectName}</p>
                    <p>Status: {showingStatusLabel(s.status)}</p>
                  </CardContent>
                </Card>
                <ShowingOutcomeForm
                  showingId={s.id}
                  currentStatus={s.status}
                  currentNotes={s.outcomeNotes}
                />
              </div>
            ))}
          </div>
        )}

        <div>
          <h2 className="mb-3 text-lg font-semibold">History</h2>
          <ShowingsTable items={showings} />
        </div>
      </div>
    </DashboardShell>
  );
}
