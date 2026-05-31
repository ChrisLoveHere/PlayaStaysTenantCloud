"use client";

import { useActionState } from "react";
import { rejectPaymentClaim } from "@/lib/actions/rent-claims";
import type { RentClaimActionState } from "@/lib/actions/rent-claims";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RejectClaimForm({ claimId }: { claimId: string }) {
  const action = rejectPaymentClaim.bind(null, claimId);
  const [state, formAction, pending] = useActionState(
    action as (
      prev: RentClaimActionState,
      fd: FormData
    ) => Promise<RentClaimActionState>,
    {} as RentClaimActionState
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <Input
        name="landlordNotes"
        placeholder="Reason (optional)"
        className="max-w-xs"
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : "Decline"}
      </Button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
