import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { MoveChecklistPanel } from "@/components/tenants/move-checklist-panel";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { landlordNav } from "@/lib/pages/placeholder";
import {
  getMoveChecklistsForTenant,
  getTenantByIdForLandlord,
} from "@/lib/queries/move-checklists";
import { getLocationLabel } from "@/lib/constants/locations";
import { formatMXN } from "@/lib/utils/format";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TenantDetailPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  const tenant = await getTenantByIdForLandlord(id);
  if (!tenant) notFound();

  const checklists = await getMoveChecklistsForTenant(id);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle={tenant.tenantName ?? "Tenant"}
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <Link
        href="/landlord/tenants"
        className="mb-4 inline-block text-sm text-primary hover:underline"
      >
        ← Back to tenants
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{tenant.tenantName}</CardTitle>
            <Badge variant={tenant.status === "active" ? "default" : "secondary"}>
              {tenant.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Email" value={tenant.tenantEmail} />
          <Row label="Phone" value={tenant.tenantPhone ?? "—"} />
          <Row
            label="Property"
            value={`${tenant.propertyCode} · ${getLocationLabel(tenant.location)}`}
          />
          <Row label="Rent" value={`${formatMXN(tenant.monthlyRent)}/mo`} />
          <Row label="Deposit" value={formatMXN(tenant.securityDeposit)} />
          <Row
            label="Move-in"
            value={
              tenant.moveInDate
                ? new Date(tenant.moveInDate).toLocaleDateString("en-US")
                : "—"
            }
          />
          {tenant.moveOutDate && (
            <Row
              label="Move-out"
              value={new Date(tenant.moveOutDate).toLocaleDateString("en-US")}
            />
          )}
        </CardContent>
      </Card>

      <h2 className="mb-4 text-lg font-semibold">Move-in / move-out</h2>
      <MoveChecklistPanel
        tenantId={id}
        securityDeposit={tenant.securityDeposit}
        checklists={checklists}
      />
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
