import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const prospectNav = [
  { href: "/portal", label: "Home" },
  { href: "/portal/application", label: "My Application" },
  { href: "/portal/properties", label: "Properties" },
];

const tenantNav = [
  { href: "/portal", label: "Home" },
  { href: "/portal/lease", label: "Lease & Docs" },
  { href: "/portal/payments", label: "Rent Payments" },
  { href: "/portal/maintenance", label: "Maintenance" },
];

export default async function PortalPage() {
  const session = await auth();
  const role = session?.user?.role;
  const isTenant = role === "tenant";
  const navItems = isTenant ? tenantNav : prospectNav;

  return (
    <DashboardShell
      title={isTenant ? "Tenant Portal" : "Prospect Portal"}
      subtitle="Welcome"
      navItems={navItems}
      userName={session?.user?.name}
    >
      {isTenant ? (
        <Card>
          <CardHeader>
            <CardTitle>Tenant dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>View your lease, submit maintenance requests, and track rent payments.</p>
            <Button asChild>
              <Link href="/portal/maintenance">Submit maintenance request</Link>
            </Button>
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
