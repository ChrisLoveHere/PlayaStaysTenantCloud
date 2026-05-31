"use client";

import { useActionState } from "react";
import { generateLeaseDocument } from "@/lib/actions/leases";
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

export function GenerateLeaseButton({ leaseId }: { leaseId: string }) {
  const action = generateLeaseDocument.bind(null, leaseId);
  const [state, formAction, pending] = useActionState(
    action as (prev: LeaseActionState, fd: FormData) => Promise<LeaseActionState>,
    {} as LeaseActionState
  );

  return (
    <Card className="shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <CardTitle className="text-base">Generate lease</CardTitle>
        <CardDescription>
          Creates a printable HTML lease from property and tenant details, attached
          to this lease record.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
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
        </CardContent>
        <CardFooter>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Generating…" : "Generate lease document"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
