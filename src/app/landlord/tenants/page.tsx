import { PlaceholderPage, landlordNav } from "@/lib/pages/placeholder";

export default function TenantsPage() {
  return (
    <PlaceholderPage
      title="Tenants"
      portalTitle="Landlord"
      navItems={landlordNav}
      description="View active and past tenants with lease and move-in details. Coming in Phase 5."
    />
  );
}
