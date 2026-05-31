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

type TenantRow = {
  id: string;
  status: string;
  moveInDate: Date | null;
  propertyCode: string;
  location: string;
  tenantName: string | null;
  tenantEmail: string;
  agentName: string | null;
};

export function TenantsTable({ items }: { items: TenantRow[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No tenants yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Move-in</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link
                  href={`/landlord/tenants/${t.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {t.tenantName}
                </Link>
                <div className="text-xs text-muted-foreground">{t.tenantEmail}</div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">{t.propertyCode}</span>
                <span className="block text-xs text-muted-foreground">
                  {getLocationLabel(t.location)}
                </span>
              </TableCell>
              <TableCell>{t.agentName ?? "—"}</TableCell>
              <TableCell className="text-sm">
                {t.moveInDate
                  ? new Date(t.moveInDate).toLocaleDateString("en-US")
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={t.status === "active" ? "default" : "secondary"}>
                  {t.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
