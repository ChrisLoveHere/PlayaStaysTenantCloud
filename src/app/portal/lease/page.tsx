import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tenantNav } from "@/lib/pages/placeholder";
import { getTenantLeaseForUser } from "@/lib/queries/leases";
import { getDocumentsForEntity } from "@/lib/queries/documents";
import { getLocationLabel } from "@/lib/constants/locations";
import {
  formatMXN,
  formatPropertyAddress,
  leaseStatusLabel,
} from "@/lib/utils/format";

export default async function LeasePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role === "prospect") {
    return (
      <DashboardShell
        title="PlayaStays"
        subtitle="Lease & Documents"
        navItems={[
          { href: "/portal", label: "Home" },
          { href: "/portal/application", label: "My Application" },
          { href: "/portal/properties", label: "Properties" },
        ]}
        userName={session.user.name}
      >
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Your lease will appear here once your application is approved and a
            lease is signed.{" "}
            <Link href="/portal/application" className="text-primary hover:underline">
              View application status
            </Link>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  if (session.user.role !== "tenant") redirect("/portal");

  const data = await getTenantLeaseForUser(session.user.id);

  if (!data) {
    return (
      <DashboardShell
        title="PlayaStays"
        subtitle="Lease & Documents"
        navItems={tenantNav}
        userName={session.user.name}
      >
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No lease on file yet. Contact your landlord if you believe this is an error.
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const { lease } = data;
  const leaseDocuments = await getDocumentsForEntity("lease", lease.id);
  const keycodes = lease.keycodes
    ? (() => {
        try {
          return JSON.parse(lease.keycodes) as Record<string, string>;
        } catch {
          return { info: lease.keycodes };
        }
      })()
    : null;

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Lease & Documents"
      navItems={tenantNav}
      userName={session.user.name}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-mono">{lease.propertyCode}</CardTitle>
              <Badge>{leaseStatusLabel(lease.status)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {getLocationLabel(lease.location)}
            </p>
            <p>
              {formatPropertyAddress({
                calle: lease.calle,
                colonia: lease.colonia,
                ciudad: lease.ciudad,
                estado: "",
                cp: "",
              })}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Lease term: </span>
                {new Date(lease.startDate).toLocaleDateString("en-US")} –{" "}
                {new Date(lease.endDate).toLocaleDateString("en-US")}
              </div>
              <div>
                <span className="text-muted-foreground">Monthly rent: </span>
                <strong>{formatMXN(lease.monthlyRent)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Security deposit: </span>
                {formatMXN(lease.securityDeposit)}
              </div>
              {lease.signedAt && (
                <div>
                  <span className="text-muted-foreground">Signed: </span>
                  {new Date(lease.signedAt).toLocaleDateString("en-US")}
                </div>
              )}
            </div>
            {lease.documentUrl && leaseDocuments.length === 0 && (
              <a
                href={lease.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-primary hover:underline"
              >
                Download lease document
              </a>
            )}
          </CardContent>
        </Card>

        <DocumentsPanel
          entityType="lease"
          entityId={lease.id}
          documents={leaseDocuments}
          title="Lease documents"
          description="Signed lease and related files from your landlord."
        />

        {keycodes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Access / Keycodes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {Object.entries(keycodes).map(([key, value]) => (
                <p key={key}>
                  <span className="capitalize text-muted-foreground">{key}: </span>
                  <span className="font-mono">{value}</span>
                </p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
