"use client";

import { useActionState } from "react";
import { saveMoveChecklist } from "@/lib/actions/move-checklists";
import type { MoveChecklistActionState } from "@/lib/actions/move-checklists";
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
import { formatMXN } from "@/lib/utils/format";

type ChecklistRow = {
  id: string;
  type: string;
  depositHeld: number | null;
  depositReturned: number | null;
  deductionNotes: string | null;
  conditionNotes: string | null;
  completedAt: Date | null;
  completedByName: string | null;
};

export function MoveChecklistPanel({
  tenantId,
  securityDeposit,
  checklists,
}: {
  tenantId: string;
  securityDeposit: number;
  checklists: ChecklistRow[];
}) {
  const moveIn = checklists.find((c) => c.type === "move_in");
  const moveOut = checklists.find((c) => c.type === "move_out");

  return (
    <div className="space-y-6">
      <ChecklistCard
        tenantId={tenantId}
        type="move_in"
        title="Move-in checklist"
        description="Document property condition and deposit held at move-in."
        existing={moveIn}
        defaultDeposit={securityDeposit}
        showDepositHeld
      />
      <ChecklistCard
        tenantId={tenantId}
        type="move_out"
        title="Move-out checklist"
        description="Final walkthrough, deposit return, and deductions."
        existing={moveOut}
        defaultDeposit={securityDeposit}
        showDepositReturned
      />
    </div>
  );
}

function ChecklistCard({
  tenantId,
  type,
  title,
  description,
  existing,
  defaultDeposit,
  showDepositHeld,
  showDepositReturned,
}: {
  tenantId: string;
  type: "move_in" | "move_out";
  title: string;
  description: string;
  existing?: ChecklistRow;
  defaultDeposit: number;
  showDepositHeld?: boolean;
  showDepositReturned?: boolean;
}) {
  const action = saveMoveChecklist.bind(null, tenantId);
  const [state, formAction, pending] = useActionState(
    action as (
      prev: MoveChecklistActionState,
      fd: FormData
    ) => Promise<MoveChecklistActionState>,
    {} as MoveChecklistActionState
  );

  if (existing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-green-700">Completed</p>
          <p>{existing.conditionNotes}</p>
          {existing.depositHeld != null && (
            <p>Deposit held: {formatMXN(existing.depositHeld)}</p>
          )}
          {existing.depositReturned != null && (
            <p>Deposit returned: {formatMXN(existing.depositReturned)}</p>
          )}
          {existing.deductionNotes && (
            <p className="text-muted-foreground">Deductions: {existing.deductionNotes}</p>
          )}
          {existing.completedAt && (
            <p className="text-xs text-muted-foreground">
              {new Date(existing.completedAt).toLocaleDateString("en-US")}
              {existing.completedByName && ` · ${existing.completedByName}`}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const defaultDepositMxn = (defaultDeposit / 100).toFixed(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <form action={formAction} encType="multipart/form-data">
        <input type="hidden" name="type" value={type} />
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
          {showDepositHeld && (
            <div className="space-y-2">
              <Label htmlFor={`depositHeld-${type}`}>Deposit held (MXN)</Label>
              <Input
                id={`depositHeld-${type}`}
                name="depositHeld"
                defaultValue={defaultDepositMxn}
              />
            </div>
          )}
          {showDepositReturned && (
            <>
              <div className="space-y-2">
                <Label htmlFor={`depositReturned-${type}`}>Deposit returned (MXN)</Label>
                <Input
                  id={`depositReturned-${type}`}
                  name="depositReturned"
                  defaultValue={defaultDepositMxn}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`deductionNotes-${type}`}>Deduction notes</Label>
                <Input
                  id={`deductionNotes-${type}`}
                  name="deductionNotes"
                  placeholder="Cleaning fee, wall repair…"
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor={`conditionNotes-${type}`}>Condition notes *</Label>
            <textarea
              id={`conditionNotes-${type}`}
              name="conditionNotes"
              required
              rows={4}
              placeholder="Room-by-room condition, meter readings, keys handed over…"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`photos-${type}`}>Photos (optional)</Label>
            <Input
              id={`photos-${type}`}
              name="photos"
              type="file"
              accept="image/*"
              multiple
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save checklist"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
