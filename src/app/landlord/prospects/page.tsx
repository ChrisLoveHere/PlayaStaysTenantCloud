import { Suspense } from "react";
import { auth } from "@/auth";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { ListFilterBar } from "@/components/layout/list-filter-bar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { landlordNav } from "@/lib/pages/placeholder";
import { getApplicationsForLandlord } from "@/lib/queries/applications";
import { APPLICATION_STAGES } from "@/lib/db/schema/enums";
import { applicationStageLabel } from "@/lib/utils/format";
import { matchesSearch } from "@/lib/utils/list-filters";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function ProspectsPage({ searchParams }: PageProps) {
  const session = await auth();
  const { q, status: statusFilter } = await searchParams;
  const allApplications = await getApplicationsForLandlord();

  const filtered = allApplications.filter((a) => {
    if (statusFilter && a.stage !== statusFilter) return false;
    return matchesSearch(q, [
      a.prospectName,
      a.prospectEmail,
      a.propertyCode,
      a.ciudad,
    ]);
  });

  const byStage = (stage: string) =>
    filtered.filter((a) => a.stage === stage);

  const stageOptions = APPLICATION_STAGES.map((s) => ({
    value: s,
    label: applicationStageLabel(s),
  }));

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Prospects & Applications"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <Suspense>
        <ListFilterBar
          searchPlaceholder="Search prospect, email, or property…"
          statusOptions={stageOptions}
        />
      </Suspense>

      <Tabs defaultValue={statusFilter ?? "all"}>
        <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
          <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          {APPLICATION_STAGES.filter((s) => s !== "rejected").map((stage) => (
            <TabsTrigger key={stage} value={stage}>
              {applicationStageLabel(stage)} ({byStage(stage).length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <ApplicationsTable items={filtered} />
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
