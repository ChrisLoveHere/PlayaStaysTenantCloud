import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { TenantsTable } from "@/components/tenants/tenants-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { agentNav } from "@/lib/pages/placeholder";
import { db } from "@/lib/db";
import { agentProfiles, properties, tenants, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

async function getTenantsForAgent(agentProfileId: string) {
  const tenantUser = alias(users, "tenant_user");

  return db
    .select({
      id: tenants.id,
      status: tenants.status,
      moveInDate: tenants.moveInDate,
      propertyCode: properties.propertyCode,
      location: properties.location,
      tenantName: tenantUser.name,
      tenantEmail: tenantUser.email,
      agentName: users.name,
    })
    .from(tenants)
    .innerJoin(properties, eq(tenants.propertyId, properties.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .innerJoin(agentProfiles, eq(tenants.assignedAgentId, agentProfiles.id))
    .innerJoin(users, eq(agentProfiles.userId, users.id))
    .where(eq(tenants.assignedAgentId, agentProfileId));
}

export default async function AgentTenantsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") redirect("/login");

  const profile = await getAgentProfileByUserId(session.user.id);
  if (!profile) redirect("/agent");

  const tenantList = await getTenantsForAgent(profile.id);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="My Tenants"
      navItems={agentNav}
      userName={session.user.name}
    >
      <TenantsTable
        items={tenantList.map((t) => ({ ...t, moveOutDate: null, agentName: t.agentName }))}
      />
    </DashboardShell>
  );
}
