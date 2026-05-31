import { PlaceholderPage, landlordNav } from "@/lib/pages/placeholder";

export default function AgentsPage() {
  return (
    <PlaceholderPage
      title="Leasing Agents"
      portalTitle="Landlord"
      navItems={landlordNav}
      description="Manage agent profiles, commission rates, and assignments. Coming in Phase 4."
    />
  );
}
