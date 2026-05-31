import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { LocationFilterTabs } from "@/components/dashboard/location-filter-tabs";
import { CityBreakdownTable } from "@/components/dashboard/city-breakdown-table";
import {
  OccupancyByCityChart,
  RevenueByCityChart,
  StatusDistributionChart,
} from "@/components/dashboard/portfolio-charts";
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
import { UpcomingRenewalsCard } from "@/components/dashboard/upcoming-renewals-card";
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

  const subtitle =
    city === "all"
      ? "Portfolio Overview — All Locations"
      : `Portfolio — ${getLocationLabel(city)}`;

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle={subtitle}
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Suspense>
          <LocationFilterTabs active={city} />
        </Suspense>
        <Button asChild size="sm">
          <Link href="/landlord/properties/new">+ Add property</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Properties" value={String(stats.totalProperties)} />
        <StatCard title="Occupancy" value={`${stats.occupancyRate}%`} />
        <StatCard title="Rent Potential" value={formatMXN(stats.monthlyRentPotential)} />
        <StatCard title="Collected (Month)" value={formatMXN(stats.rentCollectedMonth)} />
        <StatCard title="Collected (YTD)" value={formatMXN(stats.rentCollectedYtd)} />
        <StatCard title="Available Units" value={String(stats.available)} />
        <StatCard title="Overdue Rent" value={String(stats.overdueCount)} />
        <StatCard title="Open Maintenance" value={String(stats.openMaintenance)} />
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{getLocationLabel(city)} Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Active tenants" value={String(stats.activeTenants)} />
              <Row label="Average rent" value={formatMXN(stats.averageRent)} />
              <Row label="In maintenance" value={String(stats.maintenance)} />
              <Row label="Rent potential" value={formatMXN(stats.monthlyRentPotential)} />
            </CardContent>
          </Card>
        </div>
      )}
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
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
