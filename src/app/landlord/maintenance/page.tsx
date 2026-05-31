import { auth } from "@/auth";
import { MaintenanceTable } from "@/components/maintenance/maintenance-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";
import { getMaintenanceForLandlord } from "@/lib/queries/rent-maintenance";

export default async function MaintenancePage() {
  const session = await auth();
  const requests = await getMaintenanceForLandlord();

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Maintenance"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <MaintenanceTable items={requests} showTenant editable />
    </DashboardShell>
  );
}
