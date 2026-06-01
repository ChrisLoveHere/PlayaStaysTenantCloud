import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import { LeaseSignForm } from "@/components/leases/lease-sign-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prospectNav, tenantNav } from "@/lib/pages/placeholder";
import { getLeaseForUser } from "@/lib/queries/leases";
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

  const role = session.user.role;
  if (!["tenant", "prospect"].includes(role)) {
    redirect("/portal");
  }

  const data = await getLeaseForUser(session.user.id);
  const navItems =
    role === "tenant"
      ? tenantNav
      : data?.lease.status === "sent" || data?.lease.status === "signed"
        ? [...prospectNav, { href: "/portal/lease", label: "Lease" }]
        : prospectNav;

  if (!data) {
    return (
      <DashboardShell
        title="PlayaStays"
        subtitle="Lease & Documents"
        navItems={navItems}
        userName={session.user.name}
      >
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {role === "prospect" ? (
              <>
                Your lease will appear here once your application is approved and
                your landlord sends it for signing.{" "}
                <Link href="/portal/application" className="text-primary hover:underline">
                  View application status
                </Link>
              </>
            ) : (
              "No lease on file yet. Contact your landlord if you believe this is an error."
            )}
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const { lease } = data;
  const leaseDocuments = await getDocumentsForEntity("lease", lease.id);
  const documentUrl =
    lease.documentUrl ?? leaseDocuments[0]?.url ?? null;
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
      navItems={navItems}
      userName={session.user.name}
    >
      <div className="space-y-6">
        {lease.status === "draft" && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="py-4 text-sm">
              Your lease is being prepared. You will receive an email when it is
              ready to sign.
            </CardContent>
          </Card>
        )}

        {lease.status === "sent" && (
          <LeaseSignForm
            leaseId={lease.id}
            propertyCode={lease.propertyCode}
            tenantName={lease.tenantName ?? session.user.name ?? "Tenant"}
            startDate={lease.startDate}
            endDate={lease.endDate}
            monthlyRent={lease.monthlyRent}
            securityDeposit={lease.securityDeposit}
            documentUrl={documentUrl}
          />
        )}

        {lease.status === "signed" && role === "prospect" && (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="py-4 text-sm">
              Lease signed — thank you! Your landlord will confirm move-in and
              activate your tenant account.
            </CardContent>
          </Card>
        )}

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
                estado: lease.estado ?? "",
                cp: lease.cp ?? "",
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
                  {lease.tenantSignedName && ` by ${lease.tenantSignedName}`}
                </div>
              )}
            </div>
            {documentUrl && lease.status !== "sent" && (
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-primary hover:underline"
              >
                {lease.status === "signed" ? "Download signed lease" : "View lease document"}
              </a>
            )}
          </CardContent>
        </Card>

        <DocumentsPanel
          entityType="lease"
          entityId={lease.id}
          documents={leaseDocuments}
          title="Lease documents"
          description={
            leaseDocuments.length === 0 && !lease.documentUrl
              ? "Your landlord will upload lease documents here."
              : "Lease files from your landlord."
          }
        />

        {keycodes && role === "tenant" && (
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
