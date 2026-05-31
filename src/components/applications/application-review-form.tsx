"use client";

import { useActionState } from "react";
import { updateApplicationReview } from "@/lib/actions/applications";
import type { ApplicationActionState } from "@/lib/actions/applications";
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
import { APPLICATION_STAGES } from "@/lib/db/schema/enums";
import { applicationStageLabel } from "@/lib/utils/format";

type ReviewFormProps = {
  applicationId: string;
  stage: string;
  rating: number | null;
  landlordNotes: string | null;
  assignedAgentId: string | null;
  agents: { id: string; name: string | null }[];
};

export function ApplicationReviewForm({
  applicationId,
  stage,
  rating,
  landlordNotes,
  assignedAgentId,
  agents,
}: ReviewFormProps) {
  const action = updateApplicationReview.bind(null, applicationId);
  const [state, formAction, pending] = useActionState(
    action as (prev: ApplicationActionState, fd: FormData) => Promise<ApplicationActionState>,
    {} as ApplicationActionState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Screening & review</CardTitle>
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
            <Label htmlFor="stage">Pipeline stage</Label>
            <select
              id="stage"
              name="stage"
              defaultValue={stage}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {APPLICATION_STAGES.map((s) => (
                <option key={s} value={s}>
                  {applicationStageLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating">Rating (1–5)</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              min={1}
              max={5}
              defaultValue={rating ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="assignedAgentId">Assigned agent</Label>
            <select
              id="assignedAgentId"
              name="assignedAgentId"
              defaultValue={assignedAgentId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">None</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="landlordNotes">Screening notes</Label>
            <Textarea
              id="landlordNotes"
              name="landlordNotes"
              rows={4}
              defaultValue={landlordNotes ?? ""}
              placeholder="Internal notes about this applicant..."
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save review"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
