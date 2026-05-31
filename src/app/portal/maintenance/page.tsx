import { PlaceholderPage, tenantNav } from "@/lib/pages/placeholder";

export default function PortalMaintenancePage() {
  return (
    <PlaceholderPage
      title="Maintenance"
      portalTitle="Tenant Portal"
      navItems={tenantNav}
      description="Submit and track maintenance requests for your unit. Coming in Phase 6."
    />
  );
}
