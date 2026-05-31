import { auth } from "@/auth";
import { TenantsTable } from "@/components/tenants/tenants-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";
import { getTenantsForLandlord } from "@/lib/queries/leases";

export default async function TenantsPage() {
  const session = await auth();
  const tenants = await getTenantsForLandlord();

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Tenants"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <TenantsTable items={tenants} />
    </DashboardShell>
  );
}
