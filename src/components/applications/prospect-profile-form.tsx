"use client";

import { useActionState } from "react";
import { saveProspectProfile } from "@/lib/actions/applications";
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

type ProfileData = {
  income?: number | null;
  employment?: string | null;
  previousRentals?: string | null;
  references?: string | null;
};

export function ProspectProfileForm({ profile }: { profile: ProfileData }) {
  const employment = profile.employment
    ? (JSON.parse(profile.employment) as {
        employer?: string;
        position?: string;
        yearsEmployed?: number;
      })
    : {};

  const [state, formAction, pending] = useActionState(
    saveProspectProfile,
    {} as ApplicationActionState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rental application profile</CardTitle>
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
            <Label htmlFor="income">Monthly income (MXN) *</Label>
            <Input
              id="income"
              name="income"
              type="number"
              required
              defaultValue={profile.income ? profile.income / 100 : ""}
            />
            {state.fieldErrors?.income && (
              <p className="text-xs text-red-600">{state.fieldErrors.income[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsEmployed">Years at current job *</Label>
            <Input
              id="yearsEmployed"
              name="yearsEmployed"
              type="number"
              min="0"
              required
              defaultValue={employment.yearsEmployed ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employer">Employer *</Label>
            <Input
              id="employer"
              name="employer"
              required
              defaultValue={employment.employer ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              name="position"
              required
              defaultValue={employment.position ?? ""}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="previousRentals">Previous rentals</Label>
            <Textarea
              id="previousRentals"
              name="previousRentals"
              rows={3}
              placeholder="Address, landlord, dates, reason for leaving..."
              defaultValue={profile.previousRentals ?? ""}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="references">References</Label>
            <Textarea
              id="references"
              name="references"
              rows={3}
              placeholder="Name, relationship, phone..."
              defaultValue={profile.references ?? ""}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save profile"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
