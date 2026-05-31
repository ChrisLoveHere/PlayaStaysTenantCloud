"use client";

import { useActionState } from "react";
import { createRentPayment } from "@/lib/actions/rent";
import type { RentActionState } from "@/lib/actions/rent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMXN } from "@/lib/utils/format";

type TenantOption = {
  id: string;
  tenantName: string | null;
  propertyCode: string;
  monthlyRent: number;
};

export function CreateRentPaymentForm({ tenants }: { tenants: TenantOption[] }) {
  const [state, formAction, pending] = useActionState(
    createRentPayment as (
      prev: RentActionState,
      fd: FormData
    ) => Promise<RentActionState>,
    {} as RentActionState
  );

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Record rent charge</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {state.success}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="tenantId">Tenant</Label>
            <select id="tenantId" name="tenantId" required className={selectClass}>
              <option value="">Select tenant…</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tenantName} — {t.propertyCode} ({formatMXN(t.monthlyRent)}/mo)
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (MXN)</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                placeholder="15000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" name="notes" placeholder="March 2026 rent" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending || tenants.length === 0}>
            {pending ? "Saving…" : "Create charge"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
