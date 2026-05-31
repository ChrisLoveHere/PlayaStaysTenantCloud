"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createProperty, updateProperty } from "@/lib/actions/properties";
import type { PropertyActionState } from "@/lib/actions/properties";
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
import {
  LOCATION_LABELS,
  PLAYA_LOCATIONS,
} from "@/lib/constants/locations";
import { PROPERTY_STATUSES } from "@/lib/db/schema/enums";
import { propertyStatusLabel } from "@/lib/utils/format";
import type { properties } from "@/lib/db/schema";

type Property = typeof properties.$inferSelect;

type PropertyFormProps = {
  property?: Property;
};

const defaultEstado = "Quintana Roo";

export function PropertyForm({ property }: PropertyFormProps) {
  const action = property
    ? updateProperty.bind(null, property.id)
    : createProperty;

  const [state, formAction, pending] = useActionState(
    action as (prev: PropertyActionState, fd: FormData) => Promise<PropertyActionState>,
    {}
  );

  const rentDisplay = property
    ? (property.monthlyRent / 100).toString()
    : "";
  const depositDisplay = property
    ? (property.securityDeposit / 100).toString()
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{property ? "Edit Property" : "Add Property"}</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {state.error && (
            <p className="sm:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <Field label="Property ID" name="propertyCode" required defaultValue={property?.propertyCode} error={state.fieldErrors?.propertyCode} />
          
          <div className="space-y-2">
            <Label htmlFor="location">Location / City *</Label>
            <select
              id="location"
              name="location"
              required
              defaultValue={property?.location ?? "playa_del_carmen"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              {PLAYA_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {LOCATION_LABELS[loc]}
                </option>
              ))}
            </select>
          </div>

          <Field label="Calle (Street)" name="calle" required defaultValue={property?.calle} error={state.fieldErrors?.calle} />
          <Field label="Colonia" name="colonia" required defaultValue={property?.colonia} error={state.fieldErrors?.colonia} />
          <Field label="Ciudad" name="ciudad" required defaultValue={property?.ciudad} error={state.fieldErrors?.ciudad} />
          <Field label="Estado" name="estado" required defaultValue={property?.estado ?? defaultEstado} error={state.fieldErrors?.estado} />
          <Field label="C.P." name="cp" required defaultValue={property?.cp} error={state.fieldErrors?.cp} />
          <Field label="País" name="pais" defaultValue={property?.pais ?? "México"} error={state.fieldErrors?.pais} />

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <select
              id="status"
              name="status"
              required
              defaultValue={property?.status ?? "available"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              {PROPERTY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {propertyStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>

          <Field label="Monthly Rent (MXN)" name="monthlyRent" type="number" required defaultValue={rentDisplay} error={state.fieldErrors?.monthlyRent} />
          <Field label="Security Deposit (MXN)" name="securityDeposit" type="number" required defaultValue={depositDisplay} error={state.fieldErrors?.securityDeposit} />

          <Field
            label="Agent commission %"
            name="commissionRate"
            type="number"
            defaultValue={property?.commissionRate != null ? String(property.commissionRate) : ""}
            error={state.fieldErrors?.commissionRate}
          />
          <div className="sm:col-span-2 text-xs text-muted-foreground">
            Optional listing commission override. Visible to you and agents only — not shown to tenants or prospects.
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={property?.description ?? ""} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="keycodes">Keycodes / Access</Label>
            <Textarea id="keycodes" name="keycodes" rows={2} placeholder="Building: 1234, Unit: 5678" defaultValue={property?.keycodes ?? ""} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="amenities">Amenities (comma-separated)</Label>
            <Textarea id="amenities" name="amenities" rows={2} placeholder="Pool, Parking, AC" defaultValue={property?.amenities ?? ""} />
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : property ? "Update property" : "Create property"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/landlord/properties">Cancel</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function Field({
  label,
  name,
  required,
  defaultValue,
  type = "text",
  error,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  type?: string;
  error?: string[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && " *"}
      </Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} />
      {error?.[0] && <p className="text-xs text-red-600">{error[0]}</p>}
    </div>
  );
}
