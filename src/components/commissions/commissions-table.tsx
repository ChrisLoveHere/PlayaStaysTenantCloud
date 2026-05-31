"use client";

import { markCommissionPaid } from "@/lib/actions/commissions";
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
import {
  commissionStatusLabel,
  formatMXN,
} from "@/lib/utils/format";
import { useTransition } from "react";

type CommissionRow = {
  id: string;
  amount: number;
  rate: number | null;
  type: string;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
  agentName?: string | null;
  tenantName: string | null;
  propertyCode: string;
};

export function CommissionsTable({
  items,
  showAgent = true,
  canMarkPaid = false,
}: {
  items: CommissionRow[];
  showAgent?: boolean;
  canMarkPaid?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No commissions recorded yet. Commissions are created when a lease is signed.
      </p>
    );
  }

  const totalPending = items
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-4">
      {canMarkPaid && totalPending > 0 && (
        <p className="text-sm text-muted-foreground">
          Pending total: <strong>{formatMXN(totalPending)}</strong>
        </p>
      )}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {showAgent && <TableHead>Agent</TableHead>}
              <TableHead>Tenant</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              {canMarkPaid && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-sm whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString("en-US")}
                </TableCell>
                {showAgent && <TableCell>{c.agentName ?? "—"}</TableCell>}
                <TableCell>{c.tenantName}</TableCell>
                <TableCell className="font-mono text-sm">{c.propertyCode}</TableCell>
                <TableCell>
                  {formatMXN(c.amount)}
                  {c.rate && (
                    <span className="block text-xs text-muted-foreground">
                      {c.type === "percent" ? `${c.rate}%` : "Flat fee"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={c.status === "paid" ? "default" : "secondary"}>
                    {commissionStatusLabel(c.status)}
                  </Badge>
                </TableCell>
                {canMarkPaid && (
                  <TableCell className="text-right">
                    {c.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          startTransition(() => markCommissionPaid(c.id))
                        }
                      >
                        Mark paid
                      </Button>
                    )}
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
