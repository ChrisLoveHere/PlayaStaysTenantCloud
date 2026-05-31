import { auth } from "@/auth";
import { CreateRentPaymentForm } from "@/components/rent/create-rent-payment-form";
import { RentPaymentsTable } from "@/components/rent/rent-payments-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";
import {
  getActiveTenantsForRent,
  getRentPaymentsForLandlord,
} from "@/lib/queries/rent-maintenance";

export default async function RentPage() {
  const session = await auth();
  const [payments, tenants] = await Promise.all([
    getRentPaymentsForLandlord(),
    getActiveTenantsForRent(),
  ]);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Rent Payments"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="space-y-8">
        <CreateRentPaymentForm tenants={tenants} />
        <div>
          <h2 className="mb-4 text-lg font-semibold">All payments</h2>
          <RentPaymentsTable items={payments} editable />
        </div>
      </div>
    </DashboardShell>
  );
}
