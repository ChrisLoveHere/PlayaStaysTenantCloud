import { auth } from "@/auth";
import { LandlordSettingsForm } from "@/components/settings/landlord-settings-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";
import { getLandlordSettings } from "@/lib/queries/settings";

export default async function SettingsPage() {
  const session = await auth();
  const settings = await getLandlordSettings();

  return (
    <DashboardShell
      title="Landlord"
      subtitle="Settings"
      description="SPEI bank details, notification preferences, and storage status."
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <LandlordSettingsForm
        settings={settings}
        blobEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
      />
    </DashboardShell>
  );
}
