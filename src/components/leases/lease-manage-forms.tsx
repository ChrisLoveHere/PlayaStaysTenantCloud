"use client";

import { useActionState } from "react";
import {
  confirmLeaseMoveIn,
  updateLeaseStatus,
} from "@/lib/actions/leases";
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
import { LEASE_STATUSES } from "@/lib/db/schema/enums";
import { leaseStatusLabel } from "@/lib/utils/format";

export function LeaseManageForms({
  leaseId,
  currentStatus,
}: {
  leaseId: string;
  currentStatus: string;
}) {
  const statusAction = updateLeaseStatus.bind(null, leaseId);
  const moveInAction = confirmLeaseMoveIn.bind(null, leaseId);

  const [statusState, statusFormAction, statusPending] = useActionState(
    statusAction as (prev: LeaseActionState, fd: FormData) => Promise<LeaseActionState>,
    {} as LeaseActionState
  );

  const [moveInState, moveInFormAction, moveInPending] = useActionState(
    moveInAction as (prev: LeaseActionState, fd: FormData) => Promise<LeaseActionState>,
    {} as LeaseActionState
  );

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  return (
    <div className="space-y-4">
      {currentStatus === "signed" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirm move-in</CardTitle>
          </CardHeader>
          <form action={moveInFormAction}>
            <CardContent className="space-y-4">
              {moveInState.error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {moveInState.error}
                </p>
              )}
              {moveInState.success && (
                <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                  {moveInState.success}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                After the tenant has signed, confirm move-in to convert them to a
                tenant, mark the property occupied, and create the agent commission.
              </p>
              <div className="space-y-2">
                <Label htmlFor="moveInDate">Move-in date</Label>
                <Input id="moveInDate" name="moveInDate" type="date" />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={moveInPending}>
                {moveInPending ? "Confirming…" : "Confirm move-in"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual status override</CardTitle>
        </CardHeader>
        <form action={statusFormAction}>
          <CardContent className="space-y-4">
            {statusState.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {statusState.error}
              </p>
            )}
            {statusState.success && (
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                {statusState.success}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" defaultValue={currentStatus} className={selectClass}>
                {LEASE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {leaseStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Use for expired or terminated leases. Signing normally happens in the
              tenant portal.
            </p>
          </CardContent>
          <CardFooter>
            <Button type="submit" variant="outline" disabled={statusPending}>
              {statusPending ? "Saving..." : "Update status"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
