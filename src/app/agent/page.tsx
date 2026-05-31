import { auth } from "@/auth";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Banknote, CalendarDays, ClipboardList } from "lucide-react";
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
      title="Agent"
      subtitle="Dashboard"
      description="Your showings, prospects, and commission snapshot."
      navItems={navItems}
      userName={session?.user?.name}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Upcoming showings"
          value={String(stats.upcomingShowings)}
          icon={CalendarDays}
        />
        <StatCard
          title="Active prospects"
          value={String(stats.activeProspects)}
          icon={ClipboardList}
        />
        <StatCard
          title="Pending commission"
          value={formatMXN(stats.pendingCommission)}
          icon={Banknote}
        />
      </div>
    </DashboardShell>
  );
}
