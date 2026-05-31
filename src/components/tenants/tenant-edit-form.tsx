"use client";

import { useActionState } from "react";
import {
  updateTenantByLandlord,
  type TenantActionState,
} from "@/lib/actions/tenants";
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
import { TENANT_STATUSES } from "@/lib/db/schema/enums";
import { getLocationLabel } from "@/lib/constants/locations";

type PropertyOption = {
  id: string;
  propertyCode: string;
  location: string;
};

type AgentOption = {
  id: string;
  name: string | null;
};

type TenantEditFormProps = {
  tenantId: string;
  tenant: {
    tenantName: string | null;
    tenantEmail: string;
    tenantPhone: string | null;
    propertyId: string;
    assignedAgentId: string | null;
    status: string;
    moveInDate: Date | null;
    moveOutDate: Date | null;
  };
  properties: PropertyOption[];
  agents: AgentOption[];
};

export function TenantEditForm({
  tenantId,
  tenant,
  properties,
  agents,
}: TenantEditFormProps) {
  const action = updateTenantByLandlord.bind(null, tenantId);
  const [state, formAction, pending] = useActionState(
    action as (
      prev: TenantActionState,
      fd: FormData
    ) => Promise<TenantActionState>,
    {} as TenantActionState
  );

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit tenant</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {state.error && (
            <p className="sm:col-span-2 text-sm text-destructive">{state.error}</p>
          )}
          {state.success && (
            <p className="sm:col-span-2 text-sm text-green-700">{state.success}</p>
          )}

          <div className="sm:col-span-2 text-sm text-muted-foreground">
            Login email: <strong>{tenant.tenantEmail}</strong>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required defaultValue={tenant.tenantName ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={tenant.tenantPhone ?? ""} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="propertyId">Property *</Label>
            <select
              id="propertyId"
              name="propertyId"
              required
              defaultValue={tenant.propertyId}
              className={selectClass}
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.propertyCode} · {getLocationLabel(p.location)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedAgentId">Assigned agent</Label>
            <select
              id="assignedAgentId"
              name="assignedAgentId"
              defaultValue={tenant.assignedAgentId ?? ""}
              className={selectClass}
            >
              <option value="">None</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={tenant.status}
              className={selectClass}
            >
              {TENANT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moveInDate">Move-in date</Label>
            <Input
              id="moveInDate"
              name="moveInDate"
              type="date"
              defaultValue={
                tenant.moveInDate
                  ? new Date(tenant.moveInDate).toISOString().slice(0, 10)
                  : ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moveOutDate">Move-out date</Label>
            <Input
              id="moveOutDate"
              name="moveOutDate"
              type="date"
              defaultValue={
                tenant.moveOutDate
                  ? new Date(tenant.moveOutDate).toISOString().slice(0, 10)
                  : ""
              }
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save tenant"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
