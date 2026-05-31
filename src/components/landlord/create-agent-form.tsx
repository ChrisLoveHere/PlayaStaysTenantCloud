"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createAgentByLandlord,
  type AgentActionState,
} from "@/lib/actions/agents";
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
import { COMMISSION_TYPES } from "@/lib/db/schema/enums";

export function CreateAgentForm() {
  const [state, formAction, pending] = useActionState(
    createAgentByLandlord as (
      prev: AgentActionState,
      fd: FormData
    ) => Promise<AgentActionState>,
    {} as AgentActionState
  );

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add agent</CardTitle>
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
          <div className="space-y-2">
            <Label htmlFor="commissionType">Commission type</Label>
            <select
              id="commissionType"
              name="commissionType"
              defaultValue="percent"
              className={selectClass}
            >
              {COMMISSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "percent" ? "Percent of first month rent" : "Flat amount (MXN cents)"}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="commissionRate">Commission rate *</Label>
            <Input id="commissionRate" name="commissionRate" type="number" defaultValue="10" required />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" rows={2} />
          </div>
        </CardContent>
        <CardFooter className="gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create agent"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/landlord/agents">Cancel</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
