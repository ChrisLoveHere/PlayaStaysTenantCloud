import { auth } from "@/auth";
import { CreateLeaseForm } from "@/components/leases/create-lease-form";
import { LeasesTable } from "@/components/leases/leases-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";
import {
  getApprovedApplicationsForLease,
  getLeasesForLandlord,
} from "@/lib/queries/leases";

export default async function LeasesPage() {
  const session = await auth();
  const [leases, approvedApps] = await Promise.all([
    getLeasesForLandlord(),
    getApprovedApplicationsForLease(),
  ]);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Leases"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="space-y-8">
        <CreateLeaseForm applications={approvedApps} />
        <div>
          <h2 className="mb-3 text-lg font-semibold">All leases</h2>
          <LeasesTable items={leases} />
        </div>
      </div>
    </DashboardShell>
  );
}
