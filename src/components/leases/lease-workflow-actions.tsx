"use client";

import { useActionState } from "react";
import {
  generateLeaseDocument,
  sendLeaseToTenant,
} from "@/lib/actions/leases";
import type { LeaseActionState } from "@/lib/actions/leases";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { leaseStatusLabel } from "@/lib/utils/format";

type LeaseWorkflowActionsProps = {
  leaseId: string;
  status: string;
  hasDocument: boolean;
  sentAt: Date | null;
};

export function LeaseWorkflowActions({
  leaseId,
  status,
  hasDocument,
  sentAt,
}: LeaseWorkflowActionsProps) {
  const generateAction = generateLeaseDocument.bind(null, leaseId);
  const sendAction = sendLeaseToTenant.bind(null, leaseId);

  const [generateState, generateFormAction, generatePending] = useActionState(
    generateAction as (prev: LeaseActionState, fd: FormData) => Promise<LeaseActionState>,
    {} as LeaseActionState
  );

  const [sendState, sendFormAction, sendPending] = useActionState(
    sendAction as (prev: LeaseActionState, fd: FormData) => Promise<LeaseActionState>,
    {} as LeaseActionState
  );

  const canGenerate = status === "draft" || status === "sent";
  const canSend = status === "draft" && hasDocument;
  const isSent = status === "sent" || status === "signed";

  return (
    <Card className="shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <CardTitle className="text-base">Lease workflow</CardTitle>
        <CardDescription>
          Generate from property + tenant profile, send for signing, then confirm
          move-in after the tenant signs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-2 text-sm">
          <Step
            done={hasDocument}
            active={canGenerate && !hasDocument}
            label="1. Generate lease document"
          />
          <Step
            done={isSent}
            active={hasDocument && status === "draft"}
            label="2. Send to tenant"
          />
          <Step
            done={status === "signed"}
            active={status === "sent"}
            label="3. Tenant signs in portal"
          />
          <Step
            done={false}
            active={status === "signed"}
            label="4. Confirm move-in (below)"
          />
        </ol>

        <p className="text-sm">
          Status: <strong>{leaseStatusLabel(status)}</strong>
          {sentAt && (
            <span className="text-muted-foreground">
              {" "}
              · Sent {new Date(sentAt).toLocaleDateString("en-US")}
            </span>
          )}
        </p>

        {(generateState.error || sendState.error) && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {generateState.error ?? sendState.error}
          </p>
        )}
        {(generateState.success || sendState.success) && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {generateState.success ?? sendState.success}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {canGenerate && (
          <form action={generateFormAction}>
            <Button type="submit" variant="outline" disabled={generatePending}>
              {generatePending
                ? "Generating…"
                : hasDocument
                  ? "Regenerate lease"
                  : "Generate lease"}
            </Button>
          </form>
        )}
        {canSend && (
          <form action={sendFormAction}>
            <Button type="submit" disabled={sendPending}>
              {sendPending ? "Sending…" : "Send to tenant"}
            </Button>
          </form>
        )}
        {status === "sent" && (
          <p className="text-sm text-muted-foreground">
            Waiting for tenant signature…
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

function Step({
  done,
  active,
  label,
}: {
  done: boolean;
  active: boolean;
  label: string;
}) {
  return (
    <li
      className={
        done
          ? "text-green-700"
          : active
            ? "font-medium text-foreground"
            : "text-muted-foreground"
      }
    >
      {done ? "✓ " : active ? "→ " : "○ "}
      {label}
    </li>
  );
}
