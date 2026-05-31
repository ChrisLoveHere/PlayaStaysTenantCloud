import Link from "next/link";
import { auth } from "@/auth";
import { TenantsTable } from "@/components/tenants/tenants-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { landlordNav } from "@/lib/pages/placeholder";
import { getTenantsForLandlord } from "@/lib/queries/leases";

export default async function TenantsPage() {
  const session = await auth();
  const tenants = await getTenantsForLandlord();

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Tenants"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="mb-4 flex justify-end">
        <Button asChild>
          <Link href="/landlord/tenants/new">+ Add tenant</Link>
        </Button>
      </div>
      <TenantsTable items={tenants} />
    </DashboardShell>
  );
}
