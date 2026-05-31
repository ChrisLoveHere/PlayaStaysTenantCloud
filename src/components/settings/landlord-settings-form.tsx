"use client";

import { useActionState } from "react";
import { updateLandlordSettings } from "@/lib/actions/settings";
import type { SettingsActionState } from "@/lib/actions/settings";
import type { LandlordSettings } from "@/lib/queries/settings";
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

export function LandlordSettingsForm({
  settings,
  blobEnabled,
}: {
  settings: LandlordSettings;
  blobEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateLandlordSettings as (
      prev: SettingsActionState,
      fd: FormData
    ) => Promise<SettingsActionState>,
    {} as SettingsActionState
  );

  return (
    <form action={formAction} className="space-y-6">
      <Card className="shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle className="text-base">SPEI payment details</CardTitle>
          <CardDescription>
            Shown to tenants on the rent payments page for bank transfers.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {state.error && <p className="alert-error sm:col-span-2">{state.error}</p>}
          {state.success && (
            <p className="alert-success sm:col-span-2">{state.success}</p>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="speiBeneficiary">Beneficiary name</Label>
            <Input
              id="speiBeneficiary"
              name="speiBeneficiary"
              defaultValue={settings.speiBeneficiary ?? ""}
              placeholder="PlayaStays Properties SA de CV"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="speiBank">Bank</Label>
            <Input
              id="speiBank"
              name="speiBank"
              defaultValue={settings.speiBank ?? ""}
              placeholder="BBVA"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="speiClabe">CLABE</Label>
            <Input
              id="speiClabe"
              name="speiClabe"
              defaultValue={settings.speiClabe ?? ""}
              placeholder="012345678901234567"
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm ring-1 ring-border/60">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>
            Requires Resend (<code className="text-xs">RESEND_API_KEY</code> and{" "}
            <code className="text-xs">EMAIL_FROM</code> in env).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notifyEmail">Notification email</Label>
            <Input
              id="notifyEmail"
              name="notifyEmail"
              type="email"
              defaultValue={settings.notifyEmail ?? ""}
              placeholder="landlord@yourdomain.com"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="sendApplicationEmails"
              value="on"
              defaultChecked={settings.sendApplicationEmails}
              className="h-4 w-4 rounded border-input"
            />
            Application status emails
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="sendReceiptEmails"
              value="on"
              defaultChecked={settings.sendReceiptEmails}
              className="h-4 w-4 rounded border-input"
            />
            Rent receipt emails
          </label>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 border-t">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </Button>
          <p className="text-xs text-muted-foreground">
            File storage:{" "}
            {blobEnabled
              ? "Vercel Blob (production-ready)"
              : "Local disk (dev only — set BLOB_READ_WRITE_TOKEN on Vercel)"}
          </p>
        </CardFooter>
      </Card>
    </form>
  );
}
