"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createTenantByLandlord,
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
  status: string;
};

type AgentOption = {
  id: string;
  name: string | null;
};

export function CreateTenantForm({
  properties,
  agents,
}: {
  properties: PropertyOption[];
  agents: AgentOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createTenantByLandlord as (
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
        <CardTitle className="text-base">Add tenant</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {state.error && (
            <p className="sm:col-span-2 text-sm text-destructive">{state.error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary password *</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="propertyId">Property *</Label>
            <select id="propertyId" name="propertyId" required className={selectClass}>
              <option value="">Select property…</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.propertyCode} · {getLocationLabel(p.location)} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedAgentId">Assigned agent</Label>
            <select id="assignedAgentId" name="assignedAgentId" className={selectClass}>
              <option value="">None</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="moveInDate">Move-in date</Label>
            <Input id="moveInDate" name="moveInDate" type="date" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" defaultValue="active" className={selectClass}>
              {TENANT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter className="gap-3">
          <Button type="submit" disabled={pending || properties.length === 0}>
            {pending ? "Creating…" : "Create tenant"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/landlord/tenants">Cancel</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
