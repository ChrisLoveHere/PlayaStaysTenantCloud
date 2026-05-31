"use client";

import { useActionState } from "react";
import { updateLeaseStatus, uploadLeaseDocument } from "@/lib/actions/leases";
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
  const uploadAction = uploadLeaseDocument.bind(null, leaseId);

  const [statusState, statusFormAction, statusPending] = useActionState(
    statusAction as (prev: LeaseActionState, fd: FormData) => Promise<LeaseActionState>,
    {} as LeaseActionState
  );

  const [uploadState, uploadFormAction, uploadPending] = useActionState(
    uploadAction as (prev: LeaseActionState, fd: FormData) => Promise<LeaseActionState>,
    {} as LeaseActionState
  );

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update status</CardTitle>
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
            {currentStatus !== "signed" && (
              <div className="space-y-2">
                <Label htmlFor="moveInDate">Move-in date (when signing)</Label>
                <Input id="moveInDate" name="moveInDate" type="date" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Marking as <strong>Signed</strong> converts the prospect to a tenant,
              sets the property to occupied, and creates an agent commission.
            </p>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={statusPending}>
              {statusPending ? "Saving..." : "Update status"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload lease document</CardTitle>
        </CardHeader>
        <form action={uploadFormAction}>
          <CardContent className="space-y-4">
            {uploadState.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {uploadState.error}
              </p>
            )}
            {uploadState.success && (
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                {uploadState.success}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="document">PDF or document</Label>
              <Input id="document" name="document" type="file" accept=".pdf,.doc,.docx,image/*" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={uploadPending}>
              {uploadPending ? "Uploading..." : "Upload"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
