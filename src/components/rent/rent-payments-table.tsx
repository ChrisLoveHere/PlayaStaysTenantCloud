"use client";

import Link from "next/link";
import { Fragment, useActionState, useState } from "react";
import { updateRentPayment } from "@/lib/actions/rent";
import type { RentActionState } from "@/lib/actions/rent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RENT_PAYMENT_STATUSES } from "@/lib/db/schema/enums";
import {
  formatMXN,
  rentPaymentStatusLabel,
} from "@/lib/utils/format";
import { getLocationLabel } from "@/lib/constants/locations";

type RentRow = {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate: Date | null;
  status: string;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
  tenantName: string | null;
  propertyCode: string;
  location: string;
};

function UpdatePaymentForm({
  payment,
}: {
  payment: RentRow;
}) {
  const action = updateRentPayment.bind(null, payment.id);
  const [state, formAction, pending] = useActionState(
    action as (prev: RentActionState, fd: FormData) => Promise<RentActionState>,
    {} as RentActionState
  );

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  return (
    <form action={formAction} className="space-y-3 rounded-md border bg-muted/30 p-4">
      {state.error && (
        <p className="text-sm text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-700">{state.success}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor={`status-${payment.id}`}>Status</Label>
          <select
            id={`status-${payment.id}`}
            name="status"
            defaultValue={payment.status}
            className={selectClass}
          >
            {RENT_PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {rentPaymentStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`paidDate-${payment.id}`}>Paid date</Label>
          <Input
            id={`paidDate-${payment.id}`}
            name="paidDate"
            type="date"
            defaultValue={
              payment.paidDate
                ? new Date(payment.paidDate).toISOString().slice(0, 10)
                : ""
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`reference-${payment.id}`}>SPEI reference</Label>
          <Input
            id={`reference-${payment.id}`}
            name="reference"
            defaultValue={payment.reference ?? ""}
            placeholder="Tracking number"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`method-${payment.id}`}>Method</Label>
          <Input
            id={`method-${payment.id}`}
            name="paymentMethod"
            defaultValue={payment.paymentMethod ?? "SPEI"}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`notes-${payment.id}`}>Notes</Label>
        <Input
          id={`notes-${payment.id}`}
          name="notes"
          defaultValue={payment.notes ?? ""}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Update payment"}
      </Button>
    </form>
  );
}

export function RentPaymentsTable({
  items,
  editable = false,
}: {
  items: RentRow[];
  editable?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No rent payments recorded yet.
      </p>
    );
  }

  const pendingTotal = items
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      {pendingTotal > 0 && (
        <p className="text-sm text-muted-foreground">
          Outstanding: <strong>{formatMXN(pendingTotal)}</strong>
        </p>
      )}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Due</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Receipt</TableHead>
              {editable && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <Fragment key={p.id}>
                <TableRow>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(p.dueDate).toLocaleDateString("en-US")}
                    {p.paidDate && (
                      <span className="block text-xs text-muted-foreground">
                        Paid {new Date(p.paidDate).toLocaleDateString("en-US")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{p.tenantName}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{p.propertyCode}</span>
                    <span className="block text-xs text-muted-foreground">
                      {getLocationLabel(p.location)}
                    </span>
                  </TableCell>
                  <TableCell>{formatMXN(p.amount)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === "paid"
                          ? "default"
                          : p.status === "overdue"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {rentPaymentStatusLabel(p.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {p.reference ?? "—"}
                  </TableCell>
                  <TableCell>
                    {p.status === "paid" && p.paidDate ? (
                      <Link
                        href={`/portal/payments/receipt/${p.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {editable && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExpandedId(expandedId === p.id ? null : p.id)
                        }
                      >
                        {expandedId === p.id ? "Close" : "Update"}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
                {editable && expandedId === p.id && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <UpdatePaymentForm payment={p} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
