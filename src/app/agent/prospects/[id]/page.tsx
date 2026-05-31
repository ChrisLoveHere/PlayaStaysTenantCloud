import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { ProspectNotesPanel } from "@/components/prospects/prospect-notes-panel";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { agentNav } from "@/lib/pages/placeholder";
import { getApplicationDetail } from "@/lib/queries/applications";
import { getProspectNotes } from "@/lib/queries/prospect-notes";
import {
  applicationStageLabel,
  formatMXN,
  formatPropertyAddress,
} from "@/lib/utils/format";
import { getLocationLabel } from "@/lib/constants/locations";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentApplicationDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") redirect("/login");

  const profile = await getAgentProfileByUserId(session.user.id);
  if (!profile) redirect("/agent");

  const { id } = await params;
  const detail = await getApplicationDetail(id);
  if (!detail) notFound();

  const { application: app, history } = detail;
  if (app.assignedAgentId !== profile.id) notFound();

  const notes = await getProspectNotes(app.prospectId);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle={`Prospect — ${app.propertyCode}`}
      navItems={agentNav}
      userName={session.user.name}
    >
      <Link
        href="/agent/prospects"
        className="mb-4 inline-block text-sm text-primary hover:underline"
      >
        ← Back to prospects
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
                label="Stage"
                value={applicationStageLabel(app.stage)}
              />
              {app.income != null && (
                <Row label="Income" value={`${formatMXN(app.income)}/mo`} />
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
              <Row label="Rent" value={`${formatMXN(app.monthlyRent)}/mo`} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ProspectNotesPanel
            prospectId={app.prospectId}
            applicationId={app.id}
            notes={notes}
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
                    {h.notes && <p className="mt-1 text-sm">{h.notes}</p>}
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
