import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { agentNav } from "@/lib/pages/placeholder";
import { getLocationLabel } from "@/lib/constants/locations";
import { getPropertiesForAgent } from "@/lib/queries/properties";
import { formatMXN } from "@/lib/utils/format";

export default async function AgentPropertiesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") redirect("/login");

  const properties = await getPropertiesForAgent();

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Available listings"
      description="Commission rates shown per property. Not visible to tenants or prospects."
      navItems={agentNav}
      userName={session.user.name}
    >
      {properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">No available listings right now.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rent/mo</TableHead>
                <TableHead>Your commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono font-medium">{p.propertyCode}</TableCell>
                  <TableCell>{getLocationLabel(p.location)}</TableCell>
                  <TableCell>{formatMXN(p.monthlyRent)}</TableCell>
                  <TableCell>
                    {p.commissionRate != null ? (
                      <Badge variant="secondary">{p.commissionRate}%</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Default agent rate</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        Assigned prospects and showings are in{" "}
        <Link href="/agent/prospects" className="text-primary hover:underline">
          My Prospects
        </Link>
        .
      </p>
    </DashboardShell>
  );
}
