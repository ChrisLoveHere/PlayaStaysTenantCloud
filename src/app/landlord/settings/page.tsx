import { auth } from "@/auth";
import { LandlordSettingsForm } from "@/components/settings/landlord-settings-form";
import { AuditLogPanel } from "@/components/settings/audit-log-panel";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";
import { getLandlordSettings } from "@/lib/queries/settings";
import { getRecentAuditLogs } from "@/lib/queries/audit";

export default async function SettingsPage() {
  const session = await auth();
  const [settings, auditLogs] = await Promise.all([
    getLandlordSettings(),
    getRecentAuditLogs(40),
  ]);

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
      <div className="mt-8">
        <AuditLogPanel entries={auditLogs} />
      </div>
    </DashboardShell>
  );
}
