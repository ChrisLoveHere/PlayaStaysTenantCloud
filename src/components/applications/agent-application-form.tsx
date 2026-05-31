"use client";

import { useActionState } from "react";
import { updateApplicationByAgent } from "@/lib/actions/applications";
import type { ApplicationActionState } from "@/lib/actions/applications";
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
import { AGENT_APPLICATION_STAGES } from "@/lib/validations/application";
import { applicationStageLabel } from "@/lib/utils/format";

export function AgentApplicationForm({
  applicationId,
  stage,
}: {
  applicationId: string;
  stage: string;
}) {
  const action = updateApplicationByAgent.bind(null, applicationId);
  const [state, formAction, pending] = useActionState(
    action as (prev: ApplicationActionState, fd: FormData) => Promise<ApplicationActionState>,
    {} as ApplicationActionState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Update pipeline</CardTitle>
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
            <Label htmlFor="stage">Stage</Label>
            <select
              id="stage"
              name="stage"
              defaultValue={stage}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value={stage}>
                {applicationStageLabel(stage)} (current)
              </option>
              {AGENT_APPLICATION_STAGES.filter((s) => s !== stage).map((s) => (
                <option key={s} value={s}>
                  {applicationStageLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Note (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Brief note about this update…"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Approval, rejection, and lease steps are managed by the landlord.
          </p>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save update"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
