"use client";

import { useActionState } from "react";
import { blockAvailability } from "@/lib/actions/availability";
import type { AvailabilityActionState } from "@/lib/actions/availability";
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

export function BlockAvailabilityForm() {
  const [state, formAction, pending] = useActionState(
    blockAvailability,
    {} as AvailabilityActionState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Block unavailable time</CardTitle>
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
          <div className="space-y-2">
            <Label htmlFor="startAt">Start *</Label>
            <Input id="startAt" name="startAt" type="datetime-local" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt">End *</Label>
            <Input id="endAt" name="endAt" type="datetime-local" required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input id="reason" name="reason" placeholder="Vacation, personal appointment..." />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" id="allDay" name="allDay" className="h-4 w-4" />
            <Label htmlFor="allDay">All day</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Block time"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
