"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMXN } from "@/lib/utils/format";
import { propertyStatusLabel } from "@/lib/utils/format";

const STATUS_COLORS: Record<string, string> = {
  available: "#059669",
  occupied: "#0d9488",
  maintenance: "#d97706",
  off_market: "#64748b",
};

const CHART = {
  teal: "#0d9488",
  tealLight: "#5eead4",
  indigo: "#0f766e",
  sand: "#ca8a04",
};

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="shadow-sm ring-1 ring-border/60">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

type OccupancyChartProps = {
  data: { label: string; occupancy: number; total: number }[];
};

export function OccupancyByCityChart({ data }: OccupancyChartProps) {
  if (data.length === 0) {
    return <EmptyChart title="Occupancy by City" message="Add properties to see occupancy data." />;
  }

  return (
    <ChartCard title="Occupancy by city">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <Tooltip
              formatter={(v) => [`${v}%`, "Occupancy"]}
              contentStyle={{
                borderRadius: "0.5rem",
                border: "1px solid var(--border)",
                background: "var(--card)",
              }}
            />
            <Bar dataKey="occupancy" fill={CHART.teal} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

type RevenueChartProps = {
  data: { label: string; potential: number; collected: number }[];
};

export function RevenueByCityChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return <EmptyChart title="Revenue by City" message="Add properties to see revenue data." />;
  }

  const chartData = data.map((d) => ({
    label: d.label,
    potential: d.potential / 100,
    collected: d.collected / 100,
  }));

  return (
    <ChartCard title="Revenue by city (MXN)">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v) => formatMXN(Number(v) * 100)}
              contentStyle={{
                borderRadius: "0.5rem",
                border: "1px solid var(--border)",
                background: "var(--card)",
              }}
            />
            <Legend />
            <Bar dataKey="potential" name="Rent potential" fill={CHART.indigo} radius={[6, 6, 0, 0]} />
            <Bar dataKey="collected" name="Collected (month)" fill={CHART.tealLight} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

type StatusChartProps = {
  data: { status: string; count: number }[];
};

export function StatusDistributionChart({ data }: StatusChartProps) {
  if (data.length === 0) {
    return <EmptyChart title="Property Status" message="No properties yet." />;
  }

  const chartData = data.map((d) => ({
    name: propertyStatusLabel(d.status),
    value: d.count,
    status: d.status,
  }));

  return (
    <ChartCard title="Property status">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={88}
              paddingAngle={2}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] ?? "#94a3b8"}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "0.5rem",
                border: "1px solid var(--border)",
                background: "var(--card)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function EmptyChart({ title, message }: { title: string; message: string }) {
  return (
    <ChartCard title={title}>
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        {message}
      </div>
    </ChartCard>
  );
}
