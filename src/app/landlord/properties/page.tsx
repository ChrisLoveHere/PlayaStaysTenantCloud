import { PlaceholderPage, landlordNav } from "@/lib/pages/placeholder";

export default function PropertiesPage() {
  return (
    <PlaceholderPage
      title="Properties"
      portalTitle="Landlord"
      navItems={landlordNav}
      description="Manage your property portfolio — addresses, photos, keycodes, rent, and documents. Coming in Phase 2."
    />
  );
}
