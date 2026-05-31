"use client";

import { useActionState } from "react";
import { createLeaseFromApplication } from "@/lib/actions/leases";
import type { LeaseActionState } from "@/lib/actions/leases";
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
import { getLocationLabel } from "@/lib/constants/locations";
import { formatMXN } from "@/lib/utils/format";

type ApprovedApp = {
  id: string;
  propertyCode: string;
  location: string;
  monthlyRent: number;
  securityDeposit: number;
  prospectName: string | null;
};

export function CreateLeaseForm({ applications }: { applications: ApprovedApp[] }) {
  const [state, formAction, pending] = useActionState(
    createLeaseFromApplication,
    {} as LeaseActionState
  );

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No approved applications ready for a lease. Approve an application first
          under Prospects.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create lease from application</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {state.error && (
            <p className="sm:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="applicationId">Approved application *</Label>
            <select id="applicationId" name="applicationId" required className={selectClass}>
              <option value="">Select application...</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.prospectName} — {a.propertyCode} ({getLocationLabel(a.location)}) —{" "}
                  {formatMXN(a.monthlyRent)}/mo
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Lease start *</Label>
            <Input id="startDate" name="startDate" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Lease end *</Label>
            <Input id="endDate" name="endDate" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyRent">Monthly rent (MXN, optional)</Label>
            <Input id="monthlyRent" name="monthlyRent" type="number" placeholder="Uses property default" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="securityDeposit">Security deposit (MXN, optional)</Label>
            <Input id="securityDeposit" name="securityDeposit" type="number" placeholder="Uses property default" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create lease"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
