import { auth } from "@/auth";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";
import {
  getActiveAgentsForPipeline,
  getPipelineDeals,
} from "@/lib/queries/pipeline";

type PageProps = {
  searchParams: Promise<{ agent?: string }>;
};

export default async function LandlordPipelinePage({ searchParams }: PageProps) {
  const session = await auth();
  const { agent: agentFilter = "all" } = await searchParams;

  const [{ deals }, agents] = await Promise.all([
    getPipelineDeals({ agentFilter }),
    getActiveAgentsForPipeline(),
  ]);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Deal pipeline"
      description="Drag deals between stages or click a card for details. Filter by agent to view individual pipelines."
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <PipelineBoard
        deals={deals}
        agents={agents}
        role="landlord"
        detailPathPrefix="/landlord/prospects"
        showAgentFilter
        agentFilter={agentFilter}
      />
    </DashboardShell>
  );
}
