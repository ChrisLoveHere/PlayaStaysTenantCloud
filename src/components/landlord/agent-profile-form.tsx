"use client";

import { useActionState } from "react";
import {
  updateAgentProfile,
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

type AgentProfileFormProps = {
  agent: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    bio: string | null;
    commissionType: string;
    commissionRate: number;
    isActive: boolean;
  };
};

export function AgentProfileForm({ agent }: AgentProfileFormProps) {
  const action = updateAgentProfile.bind(null, agent.id);
  const [state, formAction, formPending] = useActionState(
    action as (
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
        <CardTitle className="text-base">Agent profile</CardTitle>
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
            Login email: <strong>{agent.email}</strong>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required defaultValue={agent.name ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={agent.phone ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commissionType">Commission type</Label>
            <select
              id="commissionType"
              name="commissionType"
              defaultValue={agent.commissionType}
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
            <Label htmlFor="commissionRate">Commission rate</Label>
            <Input
              id="commissionRate"
              name="commissionRate"
              type="number"
              required
              defaultValue={String(agent.commissionRate)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="isActive">Status</Label>
            <select
              id="isActive"
              name="isActive"
              defaultValue={agent.isActive ? "true" : "false"}
              className={selectClass}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="bio">Bio / notes</Label>
            <Textarea id="bio" name="bio" rows={3} defaultValue={agent.bio ?? ""} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={formPending}>
            {formPending ? "Saving…" : "Save profile"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
