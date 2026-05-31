import { Suspense } from "react";
import { auth } from "@/auth";
import { CreateMaintenanceForm } from "@/components/maintenance/create-maintenance-form";
import { MaintenanceTable } from "@/components/maintenance/maintenance-table";
import { ListFilterBar } from "@/components/layout/list-filter-bar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";
import { getDocumentsGroupedByEntity } from "@/lib/queries/documents";
import {
  getActiveTenantsForRent,
  getMaintenanceForLandlord,
  getPropertiesForMaintenance,
} from "@/lib/queries/rent-maintenance";
import { MAINTENANCE_STATUSES } from "@/lib/db/schema/enums";
import { maintenanceStatusLabel } from "@/lib/utils/format";
import { matchesSearch } from "@/lib/utils/list-filters";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function MaintenancePage({ searchParams }: PageProps) {
  const session = await auth();
  const { q, status: statusFilter } = await searchParams;

  const [requests, properties, tenants] = await Promise.all([
    getMaintenanceForLandlord(),
    getPropertiesForMaintenance(),
    getActiveTenantsForRent(),
  ]);
  const photosByRequest = await getDocumentsGroupedByEntity(
    "maintenance_request",
    requests.map((r) => r.id)
  );

  const filtered = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    return matchesSearch(q, [r.title, r.description, r.tenantName, r.propertyCode]);
  });

  const items = filtered.map((r) => ({
    ...r,
    photos: (photosByRequest.get(r.id) ?? []).map((d) => ({
      id: d.id,
      url: d.url,
      name: d.name,
    })),
  }));

  const statusOptions = MAINTENANCE_STATUSES.map((s) => ({
    value: s,
    label: maintenanceStatusLabel(s),
  }));

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Maintenance"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <CreateMaintenanceForm
        properties={properties}
        tenants={tenants.map((t) => ({
          id: t.id,
          tenantName: t.tenantName,
          propertyId: t.propertyId,
        }))}
      />

      <div className="mt-8">
        <Suspense>
          <ListFilterBar
            searchPlaceholder="Search title, tenant, or property…"
            statusOptions={statusOptions}
          />
        </Suspense>
        <MaintenanceTable items={items} showTenant editable />
      </div>
    </DashboardShell>
  );
}
