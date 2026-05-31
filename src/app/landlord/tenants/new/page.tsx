import Link from "next/link";
import { auth } from "@/auth";
import { CreateTenantForm } from "@/components/tenants/create-tenant-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { landlordNav } from "@/lib/pages/placeholder";
import {
  getActiveAgentsForSelect,
  getPropertiesForTenantForm,
} from "@/lib/actions/tenants";

export default async function NewTenantPage() {
  const session = await auth();
  const [properties, agents] = await Promise.all([
    getPropertiesForTenantForm(),
    getActiveAgentsForSelect(),
  ]);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Add tenant"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/landlord/tenants">← Back to tenants</Link>
        </Button>
      </div>
      <CreateTenantForm properties={properties} agents={agents} />
    </DashboardShell>
  );
}
