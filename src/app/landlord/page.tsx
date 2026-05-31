import { count, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { landlordNav } from "@/lib/pages/placeholder";
import { db } from "@/lib/db";
import {
  leases,
  maintenanceRequests,
  properties,
  rentPayments,
  tenants,
} from "@/lib/db/schema";
import { formatMXN } from "@/lib/utils/format";

const navItems = landlordNav;

async function getOverviewStats() {
  const [[propertyStats], [tenantCount], [openMaintenance], [overdueRent], [upcomingRenewals]] =
    await Promise.all([
      db
        .select({
          total: count(),
          occupied: sql<number>`sum(case when ${properties.status} = 'occupied' then 1 else 0 end)`,
        })
        .from(properties),
      db.select({ count: count() }).from(tenants).where(eq(tenants.status, "active")),
      db
        .select({ count: count() })
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.status, "open")),
      db
        .select({ count: count() })
        .from(rentPayments)
        .where(eq(rentPayments.status, "overdue")),
      db
        .select({ count: count() })
        .from(leases)
        .where(eq(leases.status, "signed")),
    ]);

  const total = propertyStats?.total ?? 0;
  const occupied = Number(propertyStats?.occupied ?? 0);
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return {
    totalProperties: total,
    occupancyRate,
    activeTenants: tenantCount?.count ?? 0,
    openMaintenance: openMaintenance?.count ?? 0,
    overdueRent: overdueRent?.count ?? 0,
    upcomingRenewals: upcomingRenewals?.count ?? 0,
  };
}

export default async function LandlordDashboardPage() {
  const session = await auth();
  const stats = await getOverviewStats();

  return (
    <DashboardShell
      title="Landlord"
      subtitle="Dashboard Overview"
      navItems={navItems}
      userName={session?.user?.name}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Properties" value={String(stats.totalProperties)} />
        <StatCard title="Occupancy" value={`${stats.occupancyRate}%`} />
        <StatCard title="Active Tenants" value={String(stats.activeTenants)} />
        <StatCard title="Open Maintenance" value={String(stats.openMaintenance)} />
        <StatCard title="Overdue Rent" value={String(stats.overdueRent)} />
        <StatCard title="Active Leases" value={String(stats.upcomingRenewals)} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick start</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Manage your portfolio from the sidebar. Add properties, review
            applications, schedule showings, and track rent — all in MXN.
          </p>
          <p className="mt-2">
            Sample rent display: {formatMXN(1800000)} / month
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
