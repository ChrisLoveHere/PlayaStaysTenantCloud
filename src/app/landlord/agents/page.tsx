import Link from "next/link";
import { auth } from "@/auth";
import { AgentsTable } from "@/components/landlord/agents-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { landlordNav } from "@/lib/pages/placeholder";
import { getAgentsForLandlord } from "@/lib/actions/agents";

export default async function AgentsPage() {
  const session = await auth();
  const agents = await getAgentsForLandlord();

  return (
    <DashboardShell
      title="Landlord"
      subtitle="Leasing Agents"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="mb-4 flex justify-end">
        <Button asChild>
          <Link href="/landlord/agents/new">+ Add agent</Link>
        </Button>
      </div>
      <AgentsTable agents={agents} />
    </DashboardShell>
  );
}
