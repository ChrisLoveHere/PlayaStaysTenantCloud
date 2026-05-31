"use client";

import { useActionState } from "react";
import { generateMonthlyRentAction } from "@/lib/actions/rent";
import type { RentActionState } from "@/lib/actions/rent";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BulkRentForm() {
  const [state, formAction, pending] = useActionState(
    generateMonthlyRentAction as (
      prev: RentActionState,
      fd: FormData
    ) => Promise<RentActionState>,
    {} as RentActionState
  );

  return (
    <Card className="shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <CardTitle className="text-base">Bulk monthly rent</CardTitle>
        <CardDescription>
          Create a pending rent charge for every active tenant who does not
          already have one due this month.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-3">
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
            {pending ? "Generating…" : "Generate this month's rent"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
