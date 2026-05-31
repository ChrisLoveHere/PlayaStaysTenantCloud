import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MaintenanceTable } from "@/components/maintenance/maintenance-table";
import { SubmitMaintenanceForm } from "@/components/maintenance/submit-maintenance-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { tenantNav } from "@/lib/pages/placeholder";
import { getDocumentsGroupedByEntity } from "@/lib/queries/documents";
import {
  getMaintenanceForTenant,
  getTenantByUserId,
} from "@/lib/queries/rent-maintenance";

export default async function PortalMaintenancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role === "prospect") {
    return (
      <DashboardShell
        title="PlayaStays"
        subtitle="Maintenance"
        navItems={[
          { href: "/portal", label: "Home" },
          { href: "/portal/application", label: "My Application" },
          { href: "/portal/properties", label: "Properties" },
        ]}
        userName={session.user.name}
      >
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Maintenance requests are available once you become a tenant.{" "}
            <Link href="/portal/application" className="text-primary hover:underline">
              View application status
            </Link>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  if (session.user.role !== "tenant") redirect("/portal");

  const tenant = await getTenantByUserId(session.user.id);
  if (!tenant) {
    return (
      <DashboardShell
        title="PlayaStays"
        subtitle="Maintenance"
        navItems={tenantNav}
        userName={session.user.name}
      >
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No tenancy on file. Contact your landlord if you believe this is an error.
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const requests = await getMaintenanceForTenant(tenant.id);
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
      navItems={tenantNav}
      userName={session.user.name}
    >
      <div className="space-y-8">
        <SubmitMaintenanceForm />
        <div>
          <h2 className="mb-4 text-lg font-semibold">Your requests</h2>
          <MaintenanceTable items={items} />
        </div>
      </div>
    </DashboardShell>
  );
}
