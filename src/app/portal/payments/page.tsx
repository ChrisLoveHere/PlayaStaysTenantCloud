import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RentPaymentsTable } from "@/components/rent/rent-payments-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tenantNav } from "@/lib/pages/placeholder";
import {
  getRentPaymentsForTenant,
  getTenantByUserId,
} from "@/lib/queries/rent-maintenance";
import { formatMXN } from "@/lib/utils/format";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role === "prospect") {
    return (
      <DashboardShell
        title="PlayaStays"
        subtitle="Rent Payments"
        navItems={[
          { href: "/portal", label: "Home" },
          { href: "/portal/application", label: "My Application" },
          { href: "/portal/properties", label: "Properties" },
        ]}
        userName={session.user.name}
      >
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Rent payments will appear here once you become a tenant.{" "}
            <Link href="/portal/application" className="text-primary hover:underline">
              View application status
            </Link>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  if (session.user.role !== "tenant") redirect("/portal");

  const tenant = await getTenantByUserId(session.user.id);
  if (!tenant) {
    return (
      <DashboardShell
        title="PlayaStays"
        subtitle="Rent Payments"
        navItems={tenantNav}
        userName={session.user.name}
      >
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No tenancy on file. Contact your landlord if you believe this is an error.
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const payments = await getRentPaymentsForTenant(tenant.id);
  const speiClabe = process.env.SPEI_CLABE;
  const speiBeneficiary = process.env.SPEI_BENEFICIARY;
  const speiBank = process.env.SPEI_BANK;

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Rent Payments"
      navItems={tenantNav}
      userName={session.user.name}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pay rent via SPEI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Transfer your monthly rent in MXN using SPEI. Include your property
              code <strong className="font-mono">{tenant.propertyCode}</strong> in
              the payment reference so your landlord can match it.
            </p>
            {speiClabe ? (
              <dl className="grid gap-2 sm:grid-cols-2">
                {speiBeneficiary && (
                  <div>
                    <dt className="text-muted-foreground">Beneficiary</dt>
                    <dd className="font-medium">{speiBeneficiary}</dd>
                  </div>
                )}
                {speiBank && (
                  <div>
                    <dt className="text-muted-foreground">Bank</dt>
                    <dd className="font-medium">{speiBank}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">CLABE</dt>
                  <dd className="font-mono font-medium">{speiClabe}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Monthly amount</dt>
                  <dd className="font-medium">{formatMXN(tenant.monthlyRent)}</dd>
                </div>
              </dl>
            ) : (
              <p className="rounded-md border border-dashed px-3 py-2 text-muted-foreground">
                SPEI bank details will be provided by your landlord. Contact them
                for CLABE and payment instructions.
              </p>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Payment history</h2>
          <RentPaymentsTable items={payments.map((p) => ({
            ...p,
            tenantName: null,
            propertyCode: tenant.propertyCode,
            location: tenant.location,
          }))} />
        </div>
      </div>
    </DashboardShell>
  );
}
