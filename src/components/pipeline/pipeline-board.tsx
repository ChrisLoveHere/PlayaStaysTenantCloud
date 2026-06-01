"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, GripVertical, User } from "lucide-react";
import {
  ACTIVE_PIPELINE_COLUMNS,
  PIPELINE_COLUMNS,
  type PipelineColumnId,
} from "@/lib/constants/pipeline";
import { movePipelineDeal } from "@/lib/actions/pipeline";
import type { PipelineDeal } from "@/lib/queries/pipeline";
import { getLocationLabel } from "@/lib/constants/locations";
import { formatMXN } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PipelineDealSheet } from "@/components/pipeline/pipeline-deal-sheet";
import { cn } from "@/lib/utils";

type AgentOption = { id: string; name: string | null };

type PipelineBoardProps = {
  deals: PipelineDeal[];
  agents: AgentOption[];
  role: "landlord" | "agent";
  detailPathPrefix: string;
  showAgentFilter?: boolean;
  agentFilter?: string;
};

export function PipelineBoard({
  deals,
  agents,
  role,
  detailPathPrefix,
  showAgentFilter = false,
  agentFilter = "all",
}: PipelineBoardProps) {
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const columns = useMemo(() => {
    const map = new Map<PipelineColumnId, PipelineDeal[]>();
    for (const col of PIPELINE_COLUMNS) {
      map.set(col.id, []);
    }
    for (const deal of deals) {
      const list = map.get(deal.columnId) ?? [];
      list.push(deal);
      map.set(deal.columnId, list);
    }
    return map;
  }, [deals]);

  const selectedDeal = deals.find((d) => d.id === selectedDealId) ?? null;

  function handleDrop(columnId: PipelineColumnId, deal: PipelineDeal) {
    if (deal.kind === "prospect") return;
    if (deal.columnId === columnId) return;

    startTransition(async () => {
      const result = await movePipelineDeal(deal.applicationId!, columnId);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      {showAgentFilter && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Agent:</span>
          <div className="flex flex-wrap gap-1">
            <FilterChip
              active={agentFilter === "all"}
              href="/landlord/pipeline"
              label="All deals"
            />
            <FilterChip
              active={agentFilter === "unassigned"}
              href="/landlord/pipeline?agent=unassigned"
              label="Unassigned"
            />
            {agents.map((a) => (
              <FilterChip
                key={a.id}
                active={agentFilter === a.id}
                href={`/landlord/pipeline?agent=${a.id}`}
                label={a.name ?? "Agent"}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {ACTIVE_PIPELINE_COLUMNS.map((column) => {
          const columnDeals = columns.get(column.id) ?? [];
          return (
            <div
              key={column.id}
              className={cn(
                "flex w-[280px] shrink-0 flex-col rounded-xl border bg-muted/30",
                draggingId && "ring-1 ring-border/60"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const dealId = e.dataTransfer.getData("text/deal-id");
                const deal = deals.find((d) => d.id === dealId);
                if (deal) handleDrop(column.id, deal);
                setDraggingId(null);
              }}
            >
              <div className="flex items-center justify-between border-b px-3 py-2.5">
                <h3 className="text-sm font-semibold">{column.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnDeals.length}
                </Badge>
              </div>
              <div className="flex min-h-[420px] flex-1 flex-col gap-2 p-2">
                {columnDeals.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    No deals
                  </p>
                ) : (
                  columnDeals.map((deal) => (
                    <PipelineCard
                      key={deal.id}
                      deal={deal}
                      pending={pending}
                      onDragStart={() => setDraggingId(deal.id)}
                      onDragEnd={() => setDraggingId(null)}
                      onOpen={() => setSelectedDealId(deal.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}

        <div className="flex w-[240px] shrink-0 flex-col rounded-xl border border-dashed bg-muted/20">
          <div className="flex items-center justify-between border-b px-3 py-2.5">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Rejected
            </h3>
            <Badge variant="outline" className="text-xs">
              {(columns.get("rejected") ?? []).length}
            </Badge>
          </div>
          <div
            className="flex min-h-[420px] flex-1 flex-col gap-2 p-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dealId = e.dataTransfer.getData("text/deal-id");
              const deal = deals.find((d) => d.id === dealId);
              if (deal) handleDrop("rejected", deal);
              setDraggingId(null);
            }}
          >
            {(columns.get("rejected") ?? []).map((deal) => (
              <PipelineCard
                key={deal.id}
                deal={deal}
                pending={pending}
                onDragStart={() => setDraggingId(deal.id)}
                onDragEnd={() => setDraggingId(null)}
                onOpen={() => setSelectedDealId(deal.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <PipelineDealSheet
        deal={selectedDeal}
        open={Boolean(selectedDeal)}
        onOpenChange={(open) => !open && setSelectedDealId(null)}
        agents={agents}
        role={role}
        detailPathPrefix={detailPathPrefix}
      />
    </>
  );
}

function FilterChip({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      )}
    >
      {label}
    </Link>
  );
}

function PipelineCard({
  deal,
  pending,
  onDragStart,
  onDragEnd,
  onOpen,
}: {
  deal: PipelineDeal;
  pending: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpen: () => void;
}) {
  const draggable = deal.kind === "application";

  return (
    <div
      draggable={draggable && !pending}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData("text/deal-id", deal.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        draggable && "active:cursor-grabbing",
        pending && "opacity-60"
      )}
      onClick={onOpen}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {deal.prospectName ?? "Prospect"}
          </p>
          {deal.propertyCode ? (
            <p className="mt-0.5 font-mono text-xs text-primary">
              {deal.propertyCode}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Registered — no application yet
            </p>
          )}
          {deal.location && (
            <p className="mt-1 text-xs text-muted-foreground">
              {getLocationLabel(deal.location)}
              {deal.monthlyRent != null && ` · ${formatMXN(deal.monthlyRent)}/mo`}
            </p>
          )}
          {deal.assignedAgentName && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {deal.assignedAgentName}
            </p>
          )}
          {deal.nextShowingAt && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Viewing{" "}
              {new Date(deal.nextShowingAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
