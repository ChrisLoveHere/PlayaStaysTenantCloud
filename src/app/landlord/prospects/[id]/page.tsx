import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { ApplicationReviewForm } from "@/components/applications/application-review-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { landlordNav } from "@/lib/pages/placeholder";
import { getApplicationDetail } from "@/lib/queries/applications";
import {
  applicationStageLabel,
  formatMXN,
  formatPropertyAddress,
} from "@/lib/utils/format";
import { getLocationLabel } from "@/lib/constants/locations";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationDetailPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const detail = await getApplicationDetail(id);

  if (!detail) notFound();

  const { application: app, history, agents } = detail;
  const employment = app.employment
    ? (JSON.parse(app.employment) as {
        employer?: string;
        position?: string;
        yearsEmployed?: number;
      })
    : null;

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle={`Application — ${app.propertyCode}`}
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <Link
        href="/landlord/prospects"
        className="mb-4 inline-block text-sm text-primary hover:underline"
      >
        ← Back to applications
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prospect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Name" value={app.prospectName ?? "—"} />
              <Row label="Email" value={app.prospectEmail} />
              <Row label="Phone" value={app.prospectPhone ?? "—"} />
              <Row
                label="Income"
                value={app.income ? formatMXN(app.income) + "/mo" : "—"}
              />
              {employment && (
                <>
                  <Row label="Employer" value={employment.employer ?? "—"} />
                  <Row label="Position" value={employment.position ?? "—"} />
                  <Row
                    label="Years employed"
                    value={String(employment.yearsEmployed ?? "—")}
                  />
                </>
              )}
              {app.previousRentals && (
                <div>
                  <p className="text-muted-foreground">Previous rentals</p>
                  <p className="mt-1 whitespace-pre-wrap">{app.previousRentals}</p>
                </div>
              )}
              {app.references && (
                <div>
                  <p className="text-muted-foreground">References</p>
                  <p className="mt-1 whitespace-pre-wrap">{app.references}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="ID" value={app.propertyCode} />
              <Row label="Location" value={getLocationLabel(app.location)} />
              <Row
                label="Address"
                value={formatPropertyAddress({
                  calle: app.calle,
                  colonia: app.colonia,
                  ciudad: app.ciudad,
                  estado: app.estado,
                  cp: app.cp,
                })}
              />
              <Row label="Rent" value={formatMXN(app.monthlyRent) + "/mo"} />
              <Row
                label="Deposit"
                value={formatMXN(app.securityDeposit)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ApplicationReviewForm
            applicationId={app.id}
            stage={app.stage}
            rating={app.rating}
            landlordNotes={app.landlordNotes}
            assignedAgentId={app.assignedAgentId}
            agents={agents}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stage history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stage changes yet.</p>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="border-b pb-2 last:border-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {h.fromStage && (
                        <Badge variant="outline">
                          {applicationStageLabel(h.fromStage)}
                        </Badge>
                      )}
                      <span className="text-muted-foreground">→</span>
                      <Badge>{applicationStageLabel(h.toStage)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(h.createdAt).toLocaleString("en-US")}
                      {h.changedByName && ` · ${h.changedByName}`}
                    </p>
                    {h.notes && (
                      <p className="mt-1 text-sm">{h.notes}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
