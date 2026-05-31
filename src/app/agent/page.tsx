import { auth } from "@/auth";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgentDashboardStats } from "@/lib/queries/reminders";
import { formatMXN } from "@/lib/utils/format";

const navItems = [
  { href: "/agent", label: "Overview" },
  { href: "/agent/showings", label: "My Showings" },
  { href: "/agent/prospects", label: "My Prospects" },
  { href: "/agent/tenants", label: "My Tenants" },
  { href: "/agent/availability", label: "Availability" },
  { href: "/agent/commissions", label: "Commissions" },
];

export default async function AgentDashboardPage() {
  const session = await auth();
  const profile = session?.user?.id
    ? await getAgentProfileByUserId(session.user.id)
    : null;

  const stats = profile
    ? await getAgentDashboardStats(profile.id)
    : { upcomingShowings: 0, activeProspects: 0, pendingCommission: 0 };

  return (
    <DashboardShell
      title="Leasing Agent"
      subtitle="Agent Dashboard"
      navItems={navItems}
      userName={session?.user?.name}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Showings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.upcomingShowings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Prospects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeProspects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatMXN(stats.pendingCommission)}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
