import { PlaceholderPage, agentNav } from "@/lib/pages/placeholder";

export default function AgentTenantsPage() {
  return (
    <PlaceholderPage
      title="My Tenants"
      portalTitle="Leasing Agent"
      navItems={agentNav}
      description="Tenants from leases you closed. Coming in Phase 5."
    />
  );
}
