import { and, count, eq, gte, inArray, lte, sql, sum } from "drizzle-orm";
import type { LocationFilter } from "@/lib/constants/locations";
import { PLAYA_LOCATIONS, getLocationLabel } from "@/lib/constants/locations";
import { db } from "@/lib/db";
import {
  maintenanceRequests,
  properties,
  rentPayments,
  tenants,
  commissions,
} from "@/lib/db/schema";
import type { PropertyStatus } from "@/lib/db/schema";

function locationCondition(city: LocationFilter) {
  if (city === "all") return undefined;
  return eq(properties.location, city);
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1);
}

export type PortfolioStats = {
  totalProperties: number;
  occupied: number;
  available: number;
  maintenance: number;
  occupancyRate: number;
  vacancyRate: number;
  monthlyRentPotential: number;
  rentDueMonth: number;
  rentCollectedMonth: number;
  rentOutstandingMonth: number;
  collectionRate: number;
  rentCollectedYtd: number;
  overdueCount: number;
  openMaintenance: number;
  activeTenants: number;
  averageRent: number;
  commissionsPendingTotal: number;
};

export type CityBreakdown = {
  location: string;
  label: string;
  total: number;
  occupied: number;
  available: number;
  occupancyRate: number;
  rentPotential: number;
  rentCollectedMonth: number;
  openMaintenance: number;
  averageRent: number;
};

export type StatusDistribution = {
  status: PropertyStatus;
  count: number;
};

export async function getPortfolioStats(
  city: LocationFilter = "all"
): Promise<PortfolioStats> {
  const loc = locationCondition(city);
  const where = loc ? and(loc) : undefined;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [[propStats], [tenantStats], [maintStats], [overdueStats], [monthRent], [ytdRent], [dueMonth], [outstandingMonth], [commissionPending]] =
    await Promise.all([
      db
        .select({
          total: count(),
          occupied: sql<number>`sum(case when ${properties.status} = 'occupied' then 1 else 0 end)::int`,
          available: sql<number>`sum(case when ${properties.status} = 'available' then 1 else 0 end)::int`,
          maintenance: sql<number>`sum(case when ${properties.status} = 'maintenance' then 1 else 0 end)::int`,
          rentPotential: sql<number>`coalesce(sum(${properties.monthlyRent}), 0)::int`,
          avgRent: sql<number>`coalesce(avg(${properties.monthlyRent}), 0)::int`,
        })
        .from(properties)
        .where(where),
      db
        .select({ count: count() })
        .from(tenants)
        .innerJoin(properties, eq(tenants.propertyId, properties.id))
        .where(
          loc
            ? and(eq(tenants.status, "active"), loc)
            : eq(tenants.status, "active")
        ),
      db
        .select({ count: count() })
        .from(maintenanceRequests)
        .innerJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
        .where(
          loc
            ? and(eq(maintenanceRequests.status, "open"), loc)
            : eq(maintenanceRequests.status, "open")
        ),
      db
        .select({ count: count() })
        .from(rentPayments)
        .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
        .where(
          loc
            ? and(eq(rentPayments.status, "overdue"), loc)
            : eq(rentPayments.status, "overdue")
        ),
      db
        .select({
          total: sql<number>`coalesce(sum(${rentPayments.amount}), 0)::int`,
        })
        .from(rentPayments)
        .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
        .where(
          and(
            eq(rentPayments.status, "paid"),
            gte(rentPayments.paidDate, monthStart),
            lte(rentPayments.paidDate, monthEnd),
            ...(loc ? [loc] : [])
          )
        ),
      db
        .select({
          total: sql<number>`coalesce(sum(${rentPayments.amount}), 0)::int`,
        })
        .from(rentPayments)
        .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
        .where(
          and(
            eq(rentPayments.status, "paid"),
            gte(rentPayments.paidDate, yearStart),
            ...(loc ? [loc] : [])
          )
        ),
      db
        .select({
          total: sql<number>`coalesce(sum(${rentPayments.amount}), 0)::int`,
        })
        .from(rentPayments)
        .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
        .where(
          and(
            gte(rentPayments.dueDate, monthStart),
            lte(rentPayments.dueDate, monthEnd),
            ...(loc ? [loc] : [])
          )
        ),
      db
        .select({
          total: sql<number>`coalesce(sum(${rentPayments.amount}), 0)::int`,
        })
        .from(rentPayments)
        .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
        .where(
          and(
            inArray(rentPayments.status, ["pending", "overdue", "partial"]),
            gte(rentPayments.dueDate, monthStart),
            lte(rentPayments.dueDate, monthEnd),
            ...(loc ? [loc] : [])
          )
        ),
      db
        .select({
          total: sql<number>`coalesce(sum(${commissions.amount}), 0)::int`,
        })
        .from(commissions)
        .where(eq(commissions.status, "pending")),
    ]);

  const total = propStats?.total ?? 0;
  const occupied = Number(propStats?.occupied ?? 0);
  const available = Number(propStats?.available ?? 0);
  const rentDueMonth = Number(dueMonth?.total ?? 0);
  const rentCollectedMonth = Number(monthRent?.total ?? 0);
  const rentOutstandingMonth = Number(outstandingMonth?.total ?? 0);
  const collectionRate =
    rentDueMonth > 0
      ? Math.round((rentCollectedMonth / rentDueMonth) * 100)
      : 0;

  return {
    totalProperties: total,
    occupied,
    available,
    maintenance: Number(propStats?.maintenance ?? 0),
    occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    vacancyRate: total > 0 ? Math.round((available / total) * 100) : 0,
    monthlyRentPotential: Number(propStats?.rentPotential ?? 0),
    rentDueMonth,
    rentCollectedMonth,
    rentOutstandingMonth,
    collectionRate,
    rentCollectedYtd: Number(ytdRent?.total ?? 0),
    overdueCount: overdueStats?.count ?? 0,
    openMaintenance: maintStats?.count ?? 0,
    activeTenants: tenantStats?.count ?? 0,
    averageRent: Number(propStats?.avgRent ?? 0),
    commissionsPendingTotal: Number(commissionPending?.total ?? 0),
  };
}

export async function getCityBreakdown(): Promise<CityBreakdown[]> {
  const monthStart = startOfMonth();
  const monthEnd = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const results: CityBreakdown[] = [];

  for (const location of PLAYA_LOCATIONS.filter((l) => l !== "other")) {
    const stats = await getPortfolioStats(location);
    results.push({
      location,
      label: getLocationLabel(location),
      total: stats.totalProperties,
      occupied: stats.occupied,
      available: stats.available,
      occupancyRate: stats.occupancyRate,
      rentPotential: stats.monthlyRentPotential,
      rentCollectedMonth: stats.rentCollectedMonth,
      openMaintenance: stats.openMaintenance,
      averageRent: stats.averageRent,
    });
  }

  return results.filter((c) => c.total > 0);
}

export async function getStatusDistribution(
  city: LocationFilter = "all"
): Promise<StatusDistribution[]> {
  const loc = locationCondition(city);
  const rows = await db
    .select({
      status: properties.status,
      count: count(),
    })
    .from(properties)
    .where(loc ? and(loc) : undefined)
    .groupBy(properties.status);

  return rows.map((r) => ({
    status: r.status,
    count: r.count,
  }));
}

export async function getOccupancyByCity(): Promise<
  { label: string; occupancy: number; total: number }[]
> {
  const breakdown = await getCityBreakdown();
  return breakdown.map((c) => ({
    label: c.label,
    occupancy: c.occupancyRate,
    total: c.total,
  }));
}

export async function getRevenueByCity(): Promise<
  { label: string; potential: number; collected: number }[]
> {
  const breakdown = await getCityBreakdown();
  return breakdown.map((c) => ({
    label: c.label,
    potential: c.rentPotential,
    collected: c.rentCollectedMonth,
  }));
}
