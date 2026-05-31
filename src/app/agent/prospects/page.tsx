import { PlaceholderPage, agentNav } from "@/lib/pages/placeholder";

export default function AgentProspectsPage() {
  return (
    <PlaceholderPage
      title="My Prospects"
      portalTitle="Leasing Agent"
      navItems={agentNav}
      description="Prospects and applicants assigned to you. Coming in Phase 3."
    />
  );
}
