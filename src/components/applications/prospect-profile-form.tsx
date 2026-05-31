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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProfileData = {
  firstName?: string | null;
  lastName?: string | null;
  currentAddress?: string | null;
  occupants?: number | null;
  pets?: string | null;
  income?: number | null;
  employment?: string | null;
  previousRentals?: string | null;
  references?: string | null;
  phone?: string | null;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="sm:col-span-2 border-b pb-2 text-sm font-semibold text-foreground">
      {children}
    </h3>
  );
}

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
        <CardTitle className="text-base">Rental application</CardTitle>
        <CardDescription>
          Complete this once — then you can apply to any available property.
        </CardDescription>
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

          <SectionTitle>About you</SectionTitle>

          <div className="space-y-2">
            <Label htmlFor="firstName">First name *</Label>
            <Input
              id="firstName"
              name="firstName"
              required
              autoComplete="given-name"
              defaultValue={profile.firstName ?? ""}
            />
            {state.fieldErrors?.firstName && (
              <p className="text-xs text-red-600">{state.fieldErrors.firstName[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name *</Label>
            <Input
              id="lastName"
              name="lastName"
              required
              autoComplete="family-name"
              defaultValue={profile.lastName ?? ""}
            />
            {state.fieldErrors?.lastName && (
              <p className="text-xs text-red-600">{state.fieldErrors.lastName[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              defaultValue={profile.phone ?? ""}
            />
            {state.fieldErrors?.phone && (
              <p className="text-xs text-red-600">{state.fieldErrors.phone[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="occupants">People moving in *</Label>
            <Input
              id="occupants"
              name="occupants"
              type="number"
              min="1"
              max="20"
              required
              defaultValue={profile.occupants ?? ""}
            />
            {state.fieldErrors?.occupants && (
              <p className="text-xs text-red-600">{state.fieldErrors.occupants[0]}</p>
            )}
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="currentAddress">Current address *</Label>
            <Textarea
              id="currentAddress"
              name="currentAddress"
              rows={2}
              required
              placeholder="Street, neighborhood, city, state"
              defaultValue={profile.currentAddress ?? ""}
            />
            {state.fieldErrors?.currentAddress && (
              <p className="text-xs text-red-600">{state.fieldErrors.currentAddress[0]}</p>
            )}
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="pets">Pets</Label>
            <Input
              id="pets"
              name="pets"
              placeholder="None — or type, breed, and weight (e.g. 1 small dog, 8 kg)"
              defaultValue={profile.pets ?? ""}
            />
          </div>

          <SectionTitle>Employment & income</SectionTitle>

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

          <SectionTitle>Rental history & references</SectionTitle>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="previousRentals">Previous addresses / rentals *</Label>
            <Textarea
              id="previousRentals"
              name="previousRentals"
              rows={3}
              required
              placeholder="Last 2–3 places: address, landlord or manager, dates, reason for leaving"
              defaultValue={profile.previousRentals ?? ""}
            />
            {state.fieldErrors?.previousRentals && (
              <p className="text-xs text-red-600">{state.fieldErrors.previousRentals[0]}</p>
            )}
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="references">References *</Label>
            <Textarea
              id="references"
              name="references"
              rows={3}
              required
              placeholder="Name, relationship, phone or email — e.g. prior landlord, employer"
              defaultValue={profile.references ?? ""}
            />
            {state.fieldErrors?.references && (
              <p className="text-xs text-red-600">{state.fieldErrors.references[0]}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save application"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
