import { auth } from "@/auth";
import { BulkRentForm } from "@/components/rent/bulk-rent-form";
import { CreateRentPaymentForm } from "@/components/rent/create-rent-payment-form";
import { PendingPaymentClaims } from "@/components/rent/pending-payment-claims";
import { ReferenceMatcher } from "@/components/rent/reference-matcher";
import { RentPaymentsTable } from "@/components/rent/rent-payments-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";
import {
  getActiveTenantsForRent,
  getRentPaymentsForLandlord,
} from "@/lib/queries/rent-maintenance";
import { getPendingClaimsForLandlord } from "@/lib/queries/rent-claims";

export default async function RentPage() {
  const session = await auth();
  const [payments, tenants, pendingClaims] = await Promise.all([
    getRentPaymentsForLandlord(),
    getActiveTenantsForRent(),
    getPendingClaimsForLandlord(),
  ]);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Rent Payments"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="space-y-8">
        <PendingPaymentClaims items={pendingClaims} />
        <ReferenceMatcher />
        <BulkRentForm />
        <CreateRentPaymentForm tenants={tenants} />
        <div>
          <h2 className="mb-4 text-lg font-semibold">All payments</h2>
          <RentPaymentsTable items={payments} editable />
        </div>
      </div>
    </DashboardShell>
  );
}
