import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLocationLabel } from "@/lib/constants/locations";
import { formatMXN, leaseStatusLabel } from "@/lib/utils/format";

type LeaseRow = {
  id: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  status: string;
  propertyCode: string;
  location: string;
  tenantName: string | null;
};

export function LeasesTable({ items }: { items: LeaseRow[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No leases yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Rent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{l.tenantName}</TableCell>
              <TableCell>
                <span className="font-mono text-sm">{l.propertyCode}</span>
                <span className="block text-xs text-muted-foreground">
                  {getLocationLabel(l.location)}
                </span>
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {new Date(l.startDate).toLocaleDateString("en-US")} –{" "}
                {new Date(l.endDate).toLocaleDateString("en-US")}
              </TableCell>
              <TableCell>{formatMXN(l.monthlyRent)}/mo</TableCell>
              <TableCell>
                <Badge variant={l.status === "signed" ? "default" : "secondary"}>
                  {leaseStatusLabel(l.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/landlord/leases/${l.id}`} className="text-sm text-primary hover:underline">
                  Manage
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
