import { PlaceholderPage, landlordNav } from "@/lib/pages/placeholder";

export default function ShowingsPage() {
  return (
    <PlaceholderPage
      title="Showings"
      portalTitle="Landlord"
      navItems={landlordNav}
      description="Schedule and track property viewings across all agents. Coming in Phase 4."
    />
  );
}
