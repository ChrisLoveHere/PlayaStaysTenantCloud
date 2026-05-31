import { PlaceholderPage, tenantNav } from "@/lib/pages/placeholder";

export default function LeasePage() {
  return (
    <PlaceholderPage
      title="Lease & Documents"
      portalTitle="Tenant Portal"
      navItems={tenantNav}
      description="View and download your lease and related documents. Coming in Phase 5."
    />
  );
}
