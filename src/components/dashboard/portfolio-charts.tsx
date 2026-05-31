"use client";

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
  available: "#22c55e",
  occupied: "#3b82f6",
  maintenance: "#f59e0b",
  off_market: "#94a3b8",
};

type OccupancyChartProps = {
  data: { label: string; occupancy: number; total: number }[];
};

export function OccupancyByCityChart({ data }: OccupancyChartProps) {
  if (data.length === 0) {
    return <EmptyChart title="Occupancy by City" message="Add properties to see occupancy data." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Occupancy by City</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`${v}%`, "Occupancy"]} />
            <Bar dataKey="occupancy" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revenue by City (MXN)</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatMXN(Number(v) * 100)} />
            <Legend />
            <Bar dataKey="potential" name="Rent potential" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="collected" name="Collected (month)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Property Status</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] ?? "hsl(var(--muted-foreground))"}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ title, message }: { title: string; message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}
