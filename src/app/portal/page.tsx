import { auth } from "@/auth";
import { TenantHomeSummary } from "@/components/portal/tenant-home-summary";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tenantNav } from "@/lib/pages/placeholder";
import { getTenantDashboardSummary } from "@/lib/queries/tenant-dashboard";

const prospectNav = [
  { href: "/portal", label: "Home" },
  { href: "/portal/application", label: "My Application" },
  { href: "/portal/properties", label: "Properties" },
];

export default async function PortalPage() {
  const session = await auth();
  const role = session?.user?.role;
  const isTenant = role === "tenant";
  const navItems = isTenant ? tenantNav : prospectNav;

  const summary =
    isTenant && session?.user?.id
      ? await getTenantDashboardSummary(session.user.id)
      : null;

  return (
    <DashboardShell
      title={isTenant ? "Tenant Portal" : "Prospect Portal"}
      subtitle="Welcome"
      navItems={navItems}
      userName={session?.user?.name}
    >
      {isTenant && summary ? (
        <TenantHomeSummary {...summary} />
      ) : isTenant ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No tenancy on file. Contact your landlord if you believe this is an error.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Start your application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Complete your rental application to be considered for available
              properties. You can apply to multiple properties during your search.
            </p>
            <Button asChild>
              <Link href="/portal/application">Continue application</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
