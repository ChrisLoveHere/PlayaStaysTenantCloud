import { PlaceholderPage, landlordNav } from "@/lib/pages/placeholder";

export default function MaintenancePage() {
  return (
    <PlaceholderPage
      title="Maintenance"
      portalTitle="Landlord"
      navItems={landlordNav}
      description="Review and resolve tenant maintenance requests. Coming in Phase 6."
    />
  );
}
