"use client";

import { useActionState } from "react";
import { searchRentByReference, markPaidFromMatchAction } from "@/lib/actions/rent-claims";
import type { RentClaimActionState } from "@/lib/actions/rent-claims";
import type { ReferenceMatch } from "@/lib/queries/rent-claims";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatMXN,
  rentClaimStatusLabel,
  rentPaymentStatusLabel,
} from "@/lib/utils/format";

type SearchState = RentClaimActionState & {
  matches?: ReferenceMatch[];
  searchReference?: string;
};

export function ReferenceMatcher() {
  const [state, formAction, pending] = useActionState(
    searchRentByReference as (
      prev: SearchState,
      fd: FormData
    ) => Promise<SearchState>,
    {} as SearchState
  );

  const matches = state.matches ?? [];

  return (
    <Card className="shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <CardTitle className="text-base">Match by reference</CardTitle>
        <CardDescription>
          Paste a SPEI tracking number or property code to find unpaid charges
          or pending tenant reports.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          {state.success && matches.length > 0 && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {state.success}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="reference">Reference or property code</Label>
            <Input
              id="reference"
              name="reference"
              placeholder="e.g. TUL-001 or 1234567890"
              className="font-mono"
              required
            />
          </div>
          {matches.length > 0 && (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-2 font-medium">Tenant</th>
                    <th className="p-2 font-medium">Property</th>
                    <th className="p-2 font-medium">Due</th>
                    <th className="p-2 font-medium">Amount</th>
                    <th className="p-2 font-medium">Type</th>
                    <th className="p-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={`${m.type}-${m.id}`} className="border-b">
                      <td className="p-2">{m.tenantName}</td>
                      <td className="p-2 font-mono">{m.propertyCode}</td>
                      <td className="p-2 whitespace-nowrap">
                        {new Date(m.dueDate).toLocaleDateString("en-US")}
                      </td>
                      <td className="p-2">{formatMXN(m.amount)}</td>
                      <td className="p-2">
                        <Badge variant="outline">
                          {m.type === "claim"
                            ? rentClaimStatusLabel(m.status)
                            : rentPaymentStatusLabel(m.status)}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        <MarkPaidButton
                          paymentId={m.rentPaymentId}
                          reference={m.reference ?? state.searchReference ?? ""}
                          claimId={m.claimId}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Searching…" : "Search"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function MarkPaidButton({
  paymentId,
  reference,
  claimId,
}: {
  paymentId: string;
  reference: string;
  claimId?: string;
}) {
  return (
    <form action={markPaidFromMatchAction}>
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="reference" value={reference} />
      {claimId && <input type="hidden" name="claimId" value={claimId} />}
      <Button type="submit" size="sm" variant="secondary">
        Mark paid
      </Button>
    </form>
  );
}
