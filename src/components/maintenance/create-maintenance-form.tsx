"use client";

import { useActionState } from "react";
import { createMaintenanceAsLandlord } from "@/lib/actions/maintenance";
import type { MaintenanceActionState } from "@/lib/actions/maintenance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MAINTENANCE_PRIORITIES } from "@/lib/db/schema/enums";
import { getLocationLabel } from "@/lib/constants/locations";
import { maintenancePriorityLabel } from "@/lib/utils/format";

type PropertyOption = {
  id: string;
  propertyCode: string;
  location: string;
  status: string;
};

type TenantOption = {
  id: string;
  tenantName: string | null;
  propertyId: string;
};

export function CreateMaintenanceForm({
  properties,
  tenants,
}: {
  properties: PropertyOption[];
  tenants: TenantOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createMaintenanceAsLandlord as (
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
        <CardTitle className="text-base">Create maintenance request</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-green-700">{state.success}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property *</Label>
              <select id="propertyId" name="propertyId" required className={selectClass}>
                <option value="">Select property…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.propertyCode} · {getLocationLabel(p.location)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant (optional)</Label>
              <select id="tenantId" name="tenantId" className={selectClass}>
                <option value="">No tenant / vacant unit</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tenantName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" required placeholder="AC repair, plumbing leak…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" name="description" rows={3} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <select id="priority" name="priority" required defaultValue="medium" className={selectClass}>
              {MAINTENANCE_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {maintenancePriorityLabel(p)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending || properties.length === 0}>
            {pending ? "Creating…" : "Create request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
