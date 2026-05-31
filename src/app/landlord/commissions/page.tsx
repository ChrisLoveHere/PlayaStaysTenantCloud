import { auth } from "@/auth";
import { CommissionsTable } from "@/components/commissions/commissions-table";
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
      <CommissionsTable items={commissions} canMarkPaid />
    </DashboardShell>
  );
}
