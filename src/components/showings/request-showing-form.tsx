"use client";

import { useActionState } from "react";
import { requestShowing } from "@/lib/actions/showings";
import type { ShowingActionState } from "@/lib/actions/showings";
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

type AgentOption = { id: string; name: string | null };

export function RequestShowingForm({
  propertyId,
  agents,
}: {
  propertyId: string;
  agents: AgentOption[];
}) {
  const [state, formAction, pending] = useActionState(
    requestShowing as (
      prev: ShowingActionState,
      fd: FormData
    ) => Promise<ShowingActionState>,
    {} as ShowingActionState
  );

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No agents available for showings yet. Contact the landlord.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request a showing</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {state.error && (
            <p className="sm:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="sm:col-span-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {state.success}
            </p>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="agentId">Preferred agent *</Label>
            <select id="agentId" name="agentId" required className={selectClass}>
              <option value="">Select agent…</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Preferred date & time *</Label>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Duration (minutes)</Label>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              defaultValue={30}
              min={15}
              step={15}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="I'm flexible on time, traveling from CDMX…"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Submitting…" : "Request showing"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
