"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  assignPipelineAgent,
  fetchPipelineDealDetailAction,
  movePipelineDeal,
} from "@/lib/actions/pipeline";
import type { PipelineDeal, PipelineDealDetail } from "@/lib/queries/pipeline";
import {
  ACTIVE_PIPELINE_COLUMNS,
  pipelineColumnLabel,
  type PipelineColumnId,
} from "@/lib/constants/pipeline";
import { getLocationLabel } from "@/lib/constants/locations";
import { applicationStageLabel, formatMXN } from "@/lib/utils/format";
import { IncomeScreeningBadge } from "@/components/applications/income-screening-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type AgentOption = { id: string; name: string | null };

type PipelineDealSheetProps = {
  deal: PipelineDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: AgentOption[];
  role: "landlord" | "agent";
  detailPathPrefix: string;
};

export function PipelineDealSheet({
  deal,
  open,
  onOpenChange,
  agents,
  role,
  detailPathPrefix,
}: PipelineDealSheetProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<PipelineDealDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !deal) {
      setDetail(null);
      return;
    }
    setLoading(true);
    fetchPipelineDealDetailAction(deal.id)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [open, deal]);

  if (!deal) return null;

  function moveTo(columnId: PipelineColumnId) {
    if (!deal?.applicationId) return;
    startTransition(async () => {
      const result = await movePipelineDeal(deal.applicationId!, columnId);
      if (result.error) alert(result.error);
      else {
        router.refresh();
        onOpenChange(false);
      }
    });
  }

  function assignAgent(agentId: string) {
    if (!deal?.applicationId) return;
    startTransition(async () => {
      const result = await assignPipelineAgent(
        deal.applicationId!,
        agentId || null
      );
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{deal.prospectName ?? "Prospect"}</SheetTitle>
          <SheetDescription>
            {deal.propertyCode
              ? `${deal.propertyCode} · ${pipelineColumnLabel(deal.columnId)}`
              : "New registration — no property selected yet"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 text-sm">
          <section className="space-y-2">
            <h4 className="font-semibold">Contact</h4>
            <p className="text-muted-foreground">{deal.prospectEmail}</p>
            {deal.prospectPhone && (
              <p className="text-muted-foreground">{deal.prospectPhone}</p>
            )}
          </section>

          {loading && (
            <p className="text-muted-foreground">Loading profile…</p>
          )}

          {detail && (
            <>
              {(detail.currentAddress ||
                detail.occupants != null ||
                detail.income != null) && (
                <section className="space-y-2">
                  <h4 className="font-semibold">Profile</h4>
                  {detail.currentAddress && (
                    <p className="text-muted-foreground">{detail.currentAddress}</p>
                  )}
                  {detail.occupants != null && (
                    <p className="text-muted-foreground">
                      {detail.occupants} people · Pets:{" "}
                      {detail.pets?.trim() || "None"}
                    </p>
                  )}
                  {detail.income != null && deal.monthlyRent != null && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-muted-foreground">
                        Income {formatMXN(detail.income)}/mo
                      </span>
                      <IncomeScreeningBadge
                        incomeCents={detail.income}
                        monthlyRentCents={deal.monthlyRent}
                      />
                    </div>
                  )}
                </section>
              )}

              {detail.applications.length > 0 && (
                <section className="space-y-2">
                  <h4 className="font-semibold">Properties & applications</h4>
                  <ul className="space-y-2">
                    {detail.applications.map((app) => (
                      <li
                        key={app.applicationId}
                        className="rounded-md border p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-medium">
                            {app.propertyCode}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {applicationStageLabel(app.stage)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {getLocationLabel(app.location)} ·{" "}
                          {formatMXN(app.monthlyRent)}/mo
                        </p>
                        {app.applicationId === deal.applicationId && (
                          <Link
                            href={`${detailPathPrefix}/${app.applicationId}`}
                            className="mt-2 inline-block text-xs text-primary hover:underline"
                          >
                            Open full application →
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {detail.showings.length > 0 && (
                <section className="space-y-2">
                  <h4 className="font-semibold">Showings</h4>
                  <ul className="space-y-2">
                    {detail.showings.map((s) => (
                      <li
                        key={s.id}
                        className="rounded-md border p-2.5 text-xs text-muted-foreground"
                      >
                        <span className="font-mono font-medium text-foreground">
                          {s.propertyCode}
                        </span>
                        {" · "}
                        {new Date(s.scheduledAt).toLocaleString("en-US")}
                        {" · "}
                        {s.status}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {deal.kind === "application" && (
            <section className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">Move deal</h4>
              <div className="flex flex-wrap gap-1.5">
                {ACTIVE_PIPELINE_COLUMNS.filter((c) => c.id !== deal.columnId).map(
                  (col) => (
                    <Button
                      key={col.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => moveTo(col.id)}
                    >
                      → {col.label}
                    </Button>
                  )
                )}
                {deal.columnId !== "rejected" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => moveTo("rejected")}
                  >
                    → Rejected
                  </Button>
                )}
              </div>
            </section>
          )}

          {role === "landlord" && deal.applicationId && (
            <section className="space-y-2 border-t pt-4">
              <Label htmlFor="assignAgent">Assigned agent</Label>
              <select
                id="assignAgent"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={deal.assignedAgentId ?? ""}
                disabled={pending}
                onChange={(e) => assignAgent(e.target.value)}
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </section>
          )}

          {deal.applicationId && (
            <Button asChild className="w-full" variant="secondary">
              <Link href={`${detailPathPrefix}/${deal.applicationId}`}>
                Full application review
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
