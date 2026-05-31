"use client";

import { useActionState } from "react";
import { scheduleShowing } from "@/lib/actions/showings";
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
import { getLocationLabel } from "@/lib/constants/locations";

type Option = { id: string; label: string };

type ScheduleShowingFormProps = {
  properties: { id: string; propertyCode: string; location: string }[];
  prospects: { id: string; name: string | null; email: string }[];
  agents: { id: string; name: string | null }[];
};

export function ScheduleShowingForm({
  properties,
  prospects,
  agents,
}: ScheduleShowingFormProps) {
  const [state, formAction, pending] = useActionState(
    scheduleShowing,
    {} as ShowingActionState
  );

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Schedule a showing</CardTitle>
      </CardHeader>
      <form action={formAction}>
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
            <Label htmlFor="propertyId">Property *</Label>
            <select id="propertyId" name="propertyId" required className={selectClass}>
              <option value="">Select property...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.propertyCode} — {getLocationLabel(p.location)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="prospectId">Prospect *</Label>
            <select id="prospectId" name="prospectId" required className={selectClass}>
              <option value="">Select prospect...</option>
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.email}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="agentId">Agent *</Label>
            <select id="agentId" name="agentId" required className={selectClass}>
              <option value="">Select agent...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Date & time *</Label>
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
            <Textarea id="notes" name="notes" rows={2} placeholder="Access instructions, meeting point..." />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Scheduling..." : "Schedule showing"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
