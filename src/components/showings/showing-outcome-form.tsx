"use client";

import { useActionState } from "react";
import { updateShowingOutcome } from "@/lib/actions/showings";
import type { ShowingActionState } from "@/lib/actions/showings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SHOWING_STATUSES } from "@/lib/db/schema/enums";
import { showingStatusLabel } from "@/lib/utils/format";

type ShowingOutcomeFormProps = {
  showingId: string;
  currentStatus: string;
  currentNotes?: string | null;
};

export function ShowingOutcomeForm({
  showingId,
  currentStatus,
  currentNotes,
}: ShowingOutcomeFormProps) {
  const action = updateShowingOutcome.bind(null, showingId);
  const [state, formAction, pending] = useActionState(
    action as (prev: ShowingActionState, fd: FormData) => Promise<ShowingActionState>,
    {} as ShowingActionState
  );

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Update outcome</CardTitle>
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
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={currentStatus}
              className={selectClass}
            >
              {SHOWING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {showingStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="outcomeNotes">Outcome notes</Label>
            <Textarea
              id="outcomeNotes"
              name="outcomeNotes"
              rows={3}
              defaultValue={currentNotes ?? ""}
              placeholder="How did the showing go?"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save outcome"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
