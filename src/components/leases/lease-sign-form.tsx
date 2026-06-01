"use client";

import { useActionState, useState } from "react";
import { signLease } from "@/lib/actions/leases";
import type { LeaseActionState } from "@/lib/actions/leases";
import { SignaturePad } from "@/components/leases/signature-pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMXN } from "@/lib/utils/format";

type LeaseSignFormProps = {
  leaseId: string;
  propertyCode: string;
  tenantName: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  documentUrl: string | null;
};

export function LeaseSignForm({
  leaseId,
  propertyCode,
  tenantName,
  startDate,
  endDate,
  monthlyRent,
  securityDeposit,
  documentUrl,
}: LeaseSignFormProps) {
  const action = signLease.bind(null, leaseId);
  const [state, formAction, pending] = useActionState(
    action as (prev: LeaseActionState, fd: FormData) => Promise<LeaseActionState>,
    {} as LeaseActionState
  );
  const [signatureData, setSignatureData] = useState<string | null>(null);

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-base">Sign your lease</CardTitle>
        <CardDescription>
          Review the lease for {propertyCode}, then sign below to accept the terms.
        </CardDescription>
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

          <div className="rounded-md bg-muted/50 p-4 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Term: </span>
              {new Date(startDate).toLocaleDateString("en-US")} –{" "}
              {new Date(endDate).toLocaleDateString("en-US")}
            </p>
            <p>
              <span className="text-muted-foreground">Rent: </span>
              {formatMXN(monthlyRent)}/mo
            </p>
            <p>
              <span className="text-muted-foreground">Deposit: </span>
              {formatMXN(securityDeposit)}
            </p>
            {documentUrl && (
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block pt-1 text-primary hover:underline"
              >
                Open full lease document →
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signedName">Full legal name</Label>
            <Input
              id="signedName"
              name="signedName"
              defaultValue={tenantName}
              required
              disabled={pending || !!state.success}
            />
          </div>

          <SignaturePad
            onChange={setSignatureData}
            disabled={pending || !!state.success}
          />
          <input type="hidden" name="signatureData" value={signatureData ?? ""} />

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="agreed"
              value="true"
              required
              disabled={pending || !!state.success}
              className="mt-1"
            />
            <span>
              I have read and agree to the terms of this residential lease agreement
              for {propertyCode}.
            </span>
          </label>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending || !!state.success || !signatureData}>
            {pending ? "Signing…" : state.success ? "Signed" : "Sign lease"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
