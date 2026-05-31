import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { CommissionsTable } from "@/components/commissions/commissions-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agentNav } from "@/lib/pages/placeholder";
import { getCommissionsForAgent } from "@/lib/queries/leases";
import { formatMXN } from "@/lib/utils/format";

export default async function AgentCommissionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") redirect("/login");

  const profile = await getAgentProfileByUserId(session.user.id);
  if (!profile) redirect("/agent");

  const commissions = await getCommissionsForAgent(profile.id);

  const pending = commissions
    .filter((c) => c.status === "pending")
    .reduce((s, c) => s + c.amount, 0);
  const paid = commissions
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + c.amount, 0);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="My Commissions"
      navItems={agentNav}
      userName={session.user.name}
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatMXN(pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatMXN(paid)}</p>
          </CardContent>
        </Card>
      </div>
      <CommissionsTable items={commissions} showAgent={false} />
    </DashboardShell>
  );
}
