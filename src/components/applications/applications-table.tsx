import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { IncomeScreeningBadge } from "@/components/applications/income-screening-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLocationLabel } from "@/lib/constants/locations";
import { applicationStageLabel } from "@/lib/utils/format";

type ApplicationRow = {
  id: string;
  stage: string;
  rating: number | null;
  submittedAt: Date | null;
  prospectName: string | null;
  prospectEmail: string;
  propertyCode: string;
  location: string;
  ciudad: string;
  monthlyRent?: number;
  prospectIncome?: number | null;
};

const stageVariant = (stage: string) => {
  if (stage === "approved" || stage === "lease_signed" || stage === "moved_in")
    return "default";
  if (stage === "rejected") return "destructive";
  return "secondary";
};

export function ApplicationsTable({
  items,
  detailPathPrefix = "/landlord/prospects",
}: {
  items: ApplicationRow[];
  detailPathPrefix?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No applications yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prospect</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Income</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((app) => (
            <TableRow key={app.id}>
              <TableCell>
                <div className="font-medium">{app.prospectName}</div>
                <div className="text-xs text-muted-foreground">{app.prospectEmail}</div>
              </TableCell>
              <TableCell className="font-mono text-sm">{app.propertyCode}</TableCell>
              <TableCell>{getLocationLabel(app.location)}</TableCell>
              <TableCell>
                <Badge variant={stageVariant(app.stage)}>
                  {applicationStageLabel(app.stage)}
                </Badge>
              </TableCell>
              <TableCell>
                {app.monthlyRent != null ? (
                  <IncomeScreeningBadge
                    incomeCents={app.prospectIncome}
                    monthlyRentCents={app.monthlyRent}
                  />
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{app.rating ? `${app.rating}/5` : "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {app.submittedAt
                  ? new Date(app.submittedAt).toLocaleDateString("en-US")
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`${detailPathPrefix}/${app.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Review
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
