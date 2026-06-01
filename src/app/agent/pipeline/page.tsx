import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { agentNav } from "@/lib/pages/placeholder";
import { getPipelineDeals } from "@/lib/queries/pipeline";

export default async function AgentPipelinePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") {
    redirect("/login");
  }

  const profile = await getAgentProfileByUserId(session.user.id);
  if (!profile) redirect("/agent");

  const { deals } = await getPipelineDeals({
    assignedAgentId: profile.id,
  });

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="My pipeline"
      description="Deals assigned to you. Drag cards to update stage or click for prospect details."
      navItems={agentNav}
      userName={session.user.name}
    >
      <PipelineBoard
        deals={deals}
        agents={[]}
        role="agent"
        detailPathPrefix="/agent/prospects"
      />
    </DashboardShell>
  );
}
