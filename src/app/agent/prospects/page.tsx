import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { agentNav } from "@/lib/pages/placeholder";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { getApplicationsForAgent } from "@/lib/queries/applications";

export default async function AgentProspectsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") {
    redirect("/login");
  }

  const profile = await getAgentProfileByUserId(session.user.id);
  if (!profile) redirect("/agent");

  const applications = await getApplicationsForAgent(profile.id);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="My Prospects"
      navItems={agentNav}
      userName={session.user.name}
    >
      <ApplicationsTable items={applications} detailPathPrefix="/agent/prospects" />
    </DashboardShell>
  );
}
