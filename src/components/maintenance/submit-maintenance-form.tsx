"use client";

import { useActionState } from "react";
import { submitMaintenanceRequest } from "@/lib/actions/maintenance";
import type { MaintenanceActionState } from "@/lib/actions/maintenance";
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
import { MAINTENANCE_PRIORITIES } from "@/lib/db/schema/enums";
import { maintenancePriorityLabel } from "@/lib/utils/format";

export function SubmitMaintenanceForm() {
  const [state, formAction, pending] = useActionState(
    submitMaintenanceRequest as (
      prev: MaintenanceActionState,
      fd: FormData
    ) => Promise<MaintenanceActionState>,
    {} as MaintenanceActionState
  );

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New request</CardTitle>
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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Leaking faucet in kitchen"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              placeholder="Describe the issue and when it started…"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              name="priority"
              defaultValue="medium"
              className={selectClass}
            >
              {MAINTENANCE_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {maintenancePriorityLabel(p)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Submitting…" : "Submit request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
