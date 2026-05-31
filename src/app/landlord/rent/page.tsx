import { Suspense } from "react";
import { auth } from "@/auth";
import { BulkRentForm } from "@/components/rent/bulk-rent-form";
import { CreateRentPaymentForm } from "@/components/rent/create-rent-payment-form";
import { PendingPaymentClaims } from "@/components/rent/pending-payment-claims";
import { ReferenceMatcher } from "@/components/rent/reference-matcher";
import { RentPaymentsTable } from "@/components/rent/rent-payments-table";
import { ListFilterBar } from "@/components/layout/list-filter-bar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";
import {
  getActiveTenantsForRent,
  getRentPaymentsForLandlord,
} from "@/lib/queries/rent-maintenance";
import { getPendingClaimsForLandlord } from "@/lib/queries/rent-claims";
import { RENT_PAYMENT_STATUSES } from "@/lib/db/schema/enums";
import { rentPaymentStatusLabel } from "@/lib/utils/format";
import { matchesSearch } from "@/lib/utils/list-filters";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function RentPage({ searchParams }: PageProps) {
  const session = await auth();
  const { q, status: statusFilter } = await searchParams;

  const [payments, tenants, pendingClaims] = await Promise.all([
    getRentPaymentsForLandlord(),
    getActiveTenantsForRent(),
    getPendingClaimsForLandlord(),
  ]);

  const filtered = payments.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    return matchesSearch(q, [
      p.tenantName,
      p.propertyCode,
      p.reference,
      p.notes,
    ]);
  });

  const statusOptions = RENT_PAYMENT_STATUSES.map((s) => ({
    value: s,
    label: rentPaymentStatusLabel(s),
  }));

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
          <Suspense>
            <ListFilterBar
              searchPlaceholder="Search tenant, property, or reference…"
              statusOptions={statusOptions}
            />
          </Suspense>
          <RentPaymentsTable items={filtered} editable />
        </div>
      </div>
    </DashboardShell>
  );
}
