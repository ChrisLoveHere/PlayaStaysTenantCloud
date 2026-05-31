import Link from "next/link";
import { auth } from "@/auth";
import { CreateAgentForm } from "@/components/landlord/create-agent-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { landlordNav } from "@/lib/pages/placeholder";

export default async function NewAgentPage() {
  const session = await auth();

  return (
    <DashboardShell
      title="Landlord"
      subtitle="Add agent"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/landlord/agents">← Back to agents</Link>
        </Button>
      </div>
      <CreateAgentForm />
    </DashboardShell>
  );
}
