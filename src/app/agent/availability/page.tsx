import { PlaceholderPage, agentNav } from "@/lib/pages/placeholder";

export default function AgentAvailabilityPage() {
  return (
    <PlaceholderPage
      title="Availability"
      portalTitle="Leasing Agent"
      navItems={agentNav}
      description="Block off dates and times when you are unavailable for showings. Coming in Phase 4."
    />
  );
}
