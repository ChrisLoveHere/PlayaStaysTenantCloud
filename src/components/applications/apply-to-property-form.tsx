"use client";

import { useActionState } from "react";
import { applyToProperty } from "@/lib/actions/applications";
import type { ApplicationActionState } from "@/lib/actions/applications";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLocationLabel } from "@/lib/constants/locations";
import { formatMXN } from "@/lib/utils/format";

type PropertyOption = {
  id: string;
  propertyCode: string;
  location: string;
  calle: string;
  colonia: string;
  ciudad: string;
  monthlyRent: number;
};

export function ApplyToPropertyForm({
  properties,
  profileComplete,
}: {
  properties: PropertyOption[];
  profileComplete: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    applyToProperty,
    {} as ApplicationActionState
  );

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No available properties right now. Check back soon.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Apply to a property</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {!profileComplete && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Save your profile above before applying.
            </p>
          )}
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
            <Label htmlFor="propertyId">Select property *</Label>
            <select
              id="propertyId"
              name="propertyId"
              required
              disabled={!profileComplete}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">Choose a property...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.propertyCode} — {getLocationLabel(p.location)} —{" "}
                  {formatMXN(p.monthlyRent)}/mo
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending || !profileComplete}>
            {pending ? "Submitting..." : "Submit application"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
