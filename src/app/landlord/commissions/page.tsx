import { auth } from "@/auth";
import { CommissionsTable } from "@/components/commissions/commissions-table";
import { ExportCsvButton } from "@/components/export/export-csv-button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";
import { getCommissionsForLandlord } from "@/lib/queries/leases";

export default async function CommissionsPage() {
  const session = await auth();
  const commissions = await getCommissionsForLandlord();

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Commissions"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="mb-4 flex justify-end">
        <ExportCsvButton href="/api/export/commissions" label="Export CSV" />
      </div>
      <CommissionsTable items={commissions} canMarkPaid />
    </DashboardShell>
  );
}
