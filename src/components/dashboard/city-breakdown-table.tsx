import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CityBreakdown } from "@/lib/queries/portfolio";
import { formatMXN } from "@/lib/utils/format";

export function CityBreakdownTable({ data }: { data: CityBreakdown[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Add properties across your Quintana Roo locations to see per-city metrics.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Location Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>City</TableHead>
              <TableHead className="text-right">Properties</TableHead>
              <TableHead className="text-right">Occupancy</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">Avg Rent</TableHead>
              <TableHead className="text-right">Collected (mo)</TableHead>
              <TableHead className="text-right">Maintenance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.location}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell className="text-right">{row.total}</TableCell>
                <TableCell className="text-right">{row.occupancyRate}%</TableCell>
                <TableCell className="text-right">{row.available}</TableCell>
                <TableCell className="text-right">{formatMXN(row.averageRent)}</TableCell>
                <TableCell className="text-right">{formatMXN(row.rentCollectedMonth)}</TableCell>
                <TableCell className="text-right">{row.openMaintenance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
