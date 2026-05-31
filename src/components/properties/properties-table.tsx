import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLocationLabel } from "@/lib/constants/locations";
import {
  formatMXN,
  formatPropertyAddress,
  propertyStatusLabel,
} from "@/lib/utils/format";
import type { properties } from "@/lib/db/schema";

type Property = typeof properties.$inferSelect;

export function PropertiesTable({ items }: { items: Property[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No properties yet.{" "}
        <Link href="/landlord/properties/new" className="text-primary underline">
          Add your first property
        </Link>
      </p>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Rent/mo</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono text-sm">{p.propertyCode}</TableCell>
              <TableCell>{getLocationLabel(p.location)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-sm">
                {formatPropertyAddress(p)}
              </TableCell>
              <TableCell>
                <Badge variant={p.status === "occupied" ? "default" : "secondary"}>
                  {propertyStatusLabel(p.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{formatMXN(p.monthlyRent)}</TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {p.commissionRate != null ? `${p.commissionRate}%` : "—"}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/landlord/properties/${p.id}`}>Edit</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
