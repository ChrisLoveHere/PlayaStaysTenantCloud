import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prospectNav } from "@/lib/pages/placeholder";
import { getAvailableProperties } from "@/lib/queries/applications";
import { getLocationLabel } from "@/lib/constants/locations";
import { formatMXN } from "@/lib/utils/format";

export default async function PortalPropertiesPage() {
  const session = await auth();
  if (!session?.user || !["prospect", "tenant"].includes(session.user.role)) {
    redirect("/login");
  }

  const properties = await getAvailableProperties();

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Available Properties"
      navItems={prospectNav}
      userName={session.user.name}
    >
      {properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">No available properties at this time.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {properties.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-mono text-base">{p.propertyCode}</CardTitle>
                  <Badge variant="secondary">{getLocationLabel(p.location)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {p.calle}, {p.colonia}, {p.ciudad}
                </p>
                {p.description && <p>{p.description}</p>}
                <p className="font-semibold">{formatMXN(p.monthlyRent)}/month</p>
                {session.user.role === "prospect" && (
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/portal/application">Apply now</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
