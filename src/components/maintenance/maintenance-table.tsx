"use client";

import Image from "next/image";
import { useActionState } from "react";
import { updateMaintenanceStatus } from "@/lib/actions/maintenance";
import type { MaintenanceActionState } from "@/lib/actions/maintenance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MAINTENANCE_STATUSES } from "@/lib/db/schema/enums";
import {
  maintenancePriorityLabel,
  maintenanceStatusLabel,
} from "@/lib/utils/format";
import { getLocationLabel } from "@/lib/constants/locations";

type MaintenancePhoto = {
  id: string;
  url: string;
  name: string;
};

type MaintenanceRow = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  submittedAt: Date;
  resolvedAt: Date | null;
  tenantName?: string | null;
  propertyCode?: string;
  location?: string;
  photos?: MaintenancePhoto[];
};

function StatusForm({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: string;
}) {
  const action = updateMaintenanceStatus.bind(null, requestId);
  const [state, formAction, pending] = useActionState(
    action as (
      prev: MaintenanceActionState,
      fd: FormData
    ) => Promise<MaintenanceActionState>,
    {} as MaintenanceActionState
  );

  const selectClass =
    "flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs";

  return (
    <form action={formAction} className="flex items-center gap-2">
      <select
        name="status"
        defaultValue={currentStatus}
        className={selectClass}
        aria-label="Status"
      >
        {MAINTENANCE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {maintenanceStatusLabel(s)}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        Save
      </Button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

function priorityVariant(priority: string) {
  if (priority === "urgent") return "destructive" as const;
  if (priority === "high") return "secondary" as const;
  return "outline" as const;
}

export function MaintenanceTable({
  items,
  showTenant = false,
  editable = false,
  tenantView = false,
}: {
  items: MaintenanceRow[];
  showTenant?: boolean;
  editable?: boolean;
  tenantView?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No maintenance requests yet.
      </p>
    );
  }

  const openCount = items.filter(
    (r) => r.status === "open" || r.status === "in_progress"
  ).length;

  return (
    <div className="space-y-4">
      {tenantView && openCount > 0 && (
        <p className="rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm">
          You have <strong>{openCount}</strong> open maintenance request
          {openCount === 1 ? "" : "s"}. Your landlord will update the status here.
        </p>
      )}
      {!tenantView && openCount > 0 && (
        <p className="text-sm text-muted-foreground">
          Open requests: <strong>{openCount}</strong>
        </p>
      )}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted</TableHead>
              {showTenant && <TableHead>Tenant</TableHead>}
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Photos</TableHead>
              {editable && <TableHead>Update</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(r.submittedAt).toLocaleDateString("en-US")}
                  {r.resolvedAt && (
                    <span className="block text-xs text-muted-foreground">
                      Resolved{" "}
                      {new Date(r.resolvedAt).toLocaleDateString("en-US")}
                    </span>
                  )}
                </TableCell>
                {showTenant && (
                  <TableCell>
                    {r.tenantName ?? (
                      <span className="text-muted-foreground italic">Landlord / vacant</span>
                    )}
                    {r.propertyCode && (
                      <span className="block font-mono text-xs text-muted-foreground">
                        {r.propertyCode}
                        {r.location && ` · ${getLocationLabel(r.location)}`}
                      </span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <span className="font-medium">{r.title}</span>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground line-clamp-2">
                    {r.description}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant={priorityVariant(r.priority)}>
                    {maintenancePriorityLabel(r.priority)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.status === "open"
                        ? "destructive"
                        : r.status === "in_progress"
                          ? "secondary"
                          : "default"
                    }
                  >
                    {maintenanceStatusLabel(r.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.photos && r.photos.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {r.photos.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded border"
                          title={photo.name}
                        >
                          <Image
                            src={photo.url}
                            alt={photo.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 object-cover"
                            unoptimized
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                {editable && (
                  <TableCell>
                    <StatusForm requestId={r.id} currentStatus={r.status} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
