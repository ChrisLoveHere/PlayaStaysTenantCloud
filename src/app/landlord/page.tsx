import { Suspense } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  Building2,
  Percent,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { auth } from "@/auth";
import { LocationFilterTabs } from "@/components/dashboard/location-filter-tabs";
import { CityBreakdownTable } from "@/components/dashboard/city-breakdown-table";
import {
  OccupancyByCityChart,
  RevenueByCityChart,
  StatusDistributionChart,
} from "@/components/dashboard/portfolio-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpcomingRenewalsCard } from "@/components/dashboard/upcoming-renewals-card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { landlordNav } from "@/lib/pages/placeholder";
import {
  getCityBreakdown,
  getOccupancyByCity,
  getPortfolioStats,
  getRevenueByCity,
  getStatusDistribution,
} from "@/lib/queries/portfolio";
import { getUpcomingLeaseRenewals } from "@/lib/queries/reminders";
import {
  getLocationLabel,
  parseLocationFilter,
} from "@/lib/constants/locations";
import { formatMXN } from "@/lib/utils/format";

type PageProps = {
  searchParams: Promise<{ city?: string }>;
};

export default async function LandlordDashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  const { city: cityParam } = await searchParams;
  const city = parseLocationFilter(cityParam);

  const [stats, cityBreakdown, occupancyData, revenueData, statusData, renewals] =
    await Promise.all([
      getPortfolioStats(city),
      city === "all" ? getCityBreakdown() : Promise.resolve([]),
      city === "all" ? getOccupancyByCity() : Promise.resolve([]),
      city === "all" ? getRevenueByCity() : Promise.resolve([]),
      getStatusDistribution(city),
      city === "all" ? getUpcomingLeaseRenewals(60) : Promise.resolve([]),
    ]);

  const pageTitle =
    city === "all"
      ? "Portfolio overview"
      : getLocationLabel(city);

  const pageDescription =
    city === "all"
      ? "Unified view across Playa del Carmen, Tulum, Cozumel, and your full portfolio."
      : "Metrics and status for this location.";

  return (
    <DashboardShell
      title="Landlord"
      subtitle={pageTitle}
      description={pageDescription}
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Suspense>
          <LocationFilterTabs active={city} />
        </Suspense>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/landlord/properties/new">+ Add property</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Properties"
          value={String(stats.totalProperties)}
          icon={Building2}
        />
        <StatCard
          title="Occupancy"
          value={`${stats.occupancyRate}%`}
          icon={Percent}
        />
        <StatCard
          title="Rent potential"
          value={formatMXN(stats.monthlyRentPotential)}
          icon={TrendingUp}
        />
        <StatCard
          title="Collected (month)"
          value={formatMXN(stats.rentCollectedMonth)}
          icon={Banknote}
        />
        <StatCard
          title="Collected (YTD)"
          value={formatMXN(stats.rentCollectedYtd)}
          icon={Banknote}
        />
        <StatCard
          title="Available units"
          value={String(stats.available)}
          icon={Building2}
        />
        <StatCard
          title="Overdue rent"
          value={String(stats.overdueCount)}
          icon={AlertTriangle}
        />
        <StatCard
          title="Open maintenance"
          value={String(stats.openMaintenance)}
          icon={Wrench}
        />
      </div>

      {city === "all" ? (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <OccupancyByCityChart data={occupancyData} />
            <RevenueByCityChart data={revenueData} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <StatusDistributionChart data={statusData} />
            <CityBreakdownTable data={cityBreakdown} />
          </div>
          <UpcomingRenewalsCard items={renewals} />
        </>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <StatusDistributionChart data={statusData} />
          <Card className="shadow-sm ring-1 ring-border/60">
            <CardHeader>
              <CardTitle className="text-base">
                {getLocationLabel(city)} summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Active tenants" value={String(stats.activeTenants)} />
              <Row label="Average rent" value={formatMXN(stats.averageRent)} />
              <Row label="In maintenance" value={String(stats.maintenance)} />
              <Row
                label="Rent potential"
                value={formatMXN(stats.monthlyRentPotential)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-2.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
