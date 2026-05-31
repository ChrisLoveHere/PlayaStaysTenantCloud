import { auth } from "@/auth";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { landlordNav } from "@/lib/pages/placeholder";
import { getApplicationsForLandlord } from "@/lib/queries/applications";
import { APPLICATION_STAGES } from "@/lib/db/schema/enums";
import { applicationStageLabel } from "@/lib/utils/format";

export default async function ProspectsPage() {
  const session = await auth();
  const allApplications = await getApplicationsForLandlord();

  const byStage = (stage: string) =>
    allApplications.filter((a) => a.stage === stage);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Prospects & Applications"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <Tabs defaultValue="all">
        <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
          <TabsTrigger value="all">All ({allApplications.length})</TabsTrigger>
          {APPLICATION_STAGES.filter((s) => s !== "rejected").map((stage) => (
            <TabsTrigger key={stage} value={stage}>
              {applicationStageLabel(stage)} ({byStage(stage).length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <ApplicationsTable items={allApplications} />
        </TabsContent>
        {APPLICATION_STAGES.map((stage) => (
          <TabsContent key={stage} value={stage}>
            <ApplicationsTable items={byStage(stage)} />
          </TabsContent>
        ))}
      </Tabs>
    </DashboardShell>
  );
}
