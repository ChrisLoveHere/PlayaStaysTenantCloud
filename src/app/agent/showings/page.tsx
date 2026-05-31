import { PlaceholderPage, agentNav } from "@/lib/pages/placeholder";

export default function AgentShowingsPage() {
  return (
    <PlaceholderPage
      title="My Showings"
      portalTitle="Leasing Agent"
      navItems={agentNav}
      description="Calendar view of your scheduled showings. Coming in Phase 4."
    />
  );
}
