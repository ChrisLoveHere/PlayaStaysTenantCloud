import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { LeaseManageForms } from "@/components/leases/lease-manage-forms";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { landlordNav } from "@/lib/pages/placeholder";
import { getLeaseById } from "@/lib/queries/leases";
import { getDocumentsForEntity } from "@/lib/queries/documents";
import { getLocationLabel } from "@/lib/constants/locations";
import {
  formatMXN,
  formatPropertyAddress,
  leaseStatusLabel,
} from "@/lib/utils/format";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeaseDetailPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const lease = await getLeaseById(id);

  if (!lease) notFound();

  const leaseDocuments = await getDocumentsForEntity("lease", id);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle={`Lease — ${lease.propertyCode}`}
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <Link
        href="/landlord/leases"
        className="mb-4 inline-block text-sm text-primary hover:underline"
      >
        ← Back to leases
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{lease.tenantName}</CardTitle>
            <Badge>{leaseStatusLabel(lease.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Property" value={`${lease.propertyCode} · ${getLocationLabel(lease.location)}`} />
          <Row label="Tenant email" value={lease.tenantEmail} />
          <Row
            label="Term"
            value={`${new Date(lease.startDate).toLocaleDateString("en-US")} – ${new Date(lease.endDate).toLocaleDateString("en-US")}`}
          />
          <Row label="Rent" value={`${formatMXN(lease.monthlyRent)}/mo`} />
          <Row label="Deposit" value={formatMXN(lease.securityDeposit)} />
          <Row
            label="Address"
            value={formatPropertyAddress({
              calle: lease.calle,
              colonia: lease.colonia,
              ciudad: lease.ciudad,
              estado: lease.estado,
              cp: lease.cp,
            })}
          />
          {lease.documentUrl && leaseDocuments.length === 0 && (
            <div className="sm:col-span-2">
              <a
                href={lease.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View lease document
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <DocumentsPanel
          entityType="lease"
          entityId={lease.id}
          documents={leaseDocuments}
          canUpload
          canDelete
          title="Lease documents"
          description="Upload signed lease PDFs and addenda."
        />
        <LeaseManageForms leaseId={lease.id} currentStatus={lease.status} />
      </div>
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
