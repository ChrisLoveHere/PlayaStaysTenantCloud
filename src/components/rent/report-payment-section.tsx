"use client";

import { useActionState, useState } from "react";
import { submitPaymentClaim } from "@/lib/actions/rent-claims";
import type { RentClaimActionState } from "@/lib/actions/rent-claims";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMXN, rentClaimStatusLabel } from "@/lib/utils/format";

type UnpaidCharge = {
  id: string;
  amount: number;
  dueDate: Date;
  status: string;
};

type ClaimInfo = {
  rentPaymentId: string;
  status: string;
};

function ReportPaymentForm({
  payment,
}: {
  payment: UnpaidCharge;
}) {
  const defaultAmount = (payment.amount / 100).toFixed(0);
  const defaultDate = new Date().toISOString().slice(0, 10);

  const [state, formAction, pending] = useActionState(
    submitPaymentClaim as (
      prev: RentClaimActionState,
      fd: FormData
    ) => Promise<RentClaimActionState>,
    {} as RentClaimActionState
  );

  return (
    <form action={formAction} className="space-y-3 rounded-md border bg-muted/30 p-4">
      <input type="hidden" name="rentPaymentId" value={payment.id} />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">{state.success}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`reference-${payment.id}`}>SPEI reference *</Label>
          <Input
            id={`reference-${payment.id}`}
            name="reference"
            required
            placeholder="Tracking number from your bank"
            className="font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`amount-${payment.id}`}>Amount paid (MXN) *</Label>
          <Input
            id={`amount-${payment.id}`}
            name="amount"
            required
            defaultValue={defaultAmount}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`paidDate-${payment.id}`}>Payment date *</Label>
          <Input
            id={`paidDate-${payment.id}`}
            name="paidDate"
            type="date"
            required
            defaultValue={defaultDate}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor={`notes-${payment.id}`}>Notes (optional)</Label>
          <Input
            id={`notes-${payment.id}`}
            name="tenantNotes"
            placeholder="Paid from BBVA, included property code in reference…"
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Submitting…" : "Report payment"}
      </Button>
    </form>
  );
}

export function ReportPaymentSection({
  unpaidPayments,
  claimsByPaymentId,
}: {
  unpaidPayments: UnpaidCharge[];
  claimsByPaymentId: Map<string, ClaimInfo>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (unpaidPayments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Report a payment</CardTitle>
        <CardDescription>
          After you transfer via SPEI, report it here. Your landlord will confirm
          and your payment history will update.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {unpaidPayments.map((payment) => {
          const claim = claimsByPaymentId.get(payment.id);
          const pending = claim?.status === "pending_review";

          return (
            <div key={payment.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <p className="font-medium">
                    Due {new Date(payment.dueDate).toLocaleDateString("en-US")} ·{" "}
                    {formatMXN(payment.amount)}
                  </p>
                  {claim && (
                    <Badge variant="secondary" className="mt-1">
                      {rentClaimStatusLabel(claim.status)}
                    </Badge>
                  )}
                </div>
                {!pending && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setExpandedId(expandedId === payment.id ? null : payment.id)
                    }
                  >
                    {expandedId === payment.id ? "Cancel" : "I paid"}
                  </Button>
                )}
              </div>
              {expandedId === payment.id && !pending && (
                <div className="mt-4">
                  <ReportPaymentForm payment={payment} />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
