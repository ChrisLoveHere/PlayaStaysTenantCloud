import { auth } from "@/auth";
import { MaintenanceTable } from "@/components/maintenance/maintenance-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";
import { getDocumentsGroupedByEntity } from "@/lib/queries/documents";
import { getMaintenanceForLandlord } from "@/lib/queries/rent-maintenance";

export default async function MaintenancePage() {
  const session = await auth();
  const requests = await getMaintenanceForLandlord();
  const photosByRequest = await getDocumentsGroupedByEntity(
    "maintenance_request",
    requests.map((r) => r.id)
  );

  const items = requests.map((r) => ({
    ...r,
    photos: (photosByRequest.get(r.id) ?? []).map((d) => ({
      id: d.id,
      url: d.url,
      name: d.name,
    })),
  }));

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Maintenance"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <MaintenanceTable items={items} showTenant editable />
    </DashboardShell>
  );
}
