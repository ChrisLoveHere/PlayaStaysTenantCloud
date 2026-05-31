import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { AgentProfileForm } from "@/components/landlord/agent-profile-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgentByIdForLandlord } from "@/lib/actions/agents";
import { landlordNav } from "@/lib/pages/placeholder";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentDetailPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const agent = await getAgentByIdForLandlord(id);

  if (!agent) notFound();

  return (
    <DashboardShell
      title="Landlord"
      subtitle={agent.name ?? "Agent"}
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <Link
        href="/landlord/agents"
        className="mb-4 inline-block text-sm text-primary hover:underline"
      >
        ← Back to agents
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <AgentProfileForm agent={agent} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Joined: </span>
              {new Date(agent.createdAt).toLocaleDateString("en-US")}
            </p>
            <p>
              <span className="text-muted-foreground">Commission: </span>
              {agent.commissionType === "percent"
                ? `${agent.commissionRate}% of first month rent`
                : `${agent.commissionRate} cents flat`}
            </p>
            {agent.bio && (
              <div>
                <p className="text-muted-foreground">Bio</p>
                <p className="mt-1 whitespace-pre-wrap">{agent.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
