import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMXN } from "@/lib/utils/format";

type TenantHomeSummaryProps = {
  propertyCode: string;
  unpaidCount: number;
  unpaidTotal: number;
  pendingClaimsCount: number;
  openMaintenanceCount: number;
  inProgressMaintenanceCount: number;
  leaseDocCount: number;
  leaseStatus: string | null;
};

export function TenantHomeSummary({
  propertyCode,
  unpaidCount,
  unpaidTotal,
  pendingClaimsCount,
  openMaintenanceCount,
  inProgressMaintenanceCount,
  leaseDocCount,
  leaseStatus,
}: TenantHomeSummaryProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Property <strong className="font-mono">{propertyCode}</strong>
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unpaidCount > 0 ? (
              <>
                <p className="text-2xl font-bold">{formatMXN(unpaidTotal)}</p>
                <p className="text-sm text-muted-foreground">
                  {unpaidCount} charge{unpaidCount === 1 ? "" : "s"} due
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">All caught up</p>
            )}
            {pendingClaimsCount > 0 && (
              <p className="text-sm text-amber-700">
                {pendingClaimsCount} payment report
                {pendingClaimsCount === 1 ? "" : "s"} awaiting review
              </p>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href="/portal/payments">View payments</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {openMaintenanceCount > 0 ? (
              <>
                <p className="text-2xl font-bold">{openMaintenanceCount}</p>
                <p className="text-sm text-muted-foreground">
                  open request{openMaintenanceCount === 1 ? "" : "s"}
                  {inProgressMaintenanceCount > 0 &&
                    ` · ${inProgressMaintenanceCount} in progress`}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No open requests</p>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href="/portal/maintenance">View maintenance</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lease & docs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaseDocCount > 0 ? (
              <p className="text-sm">
                <strong>{leaseDocCount}</strong> document
                {leaseDocCount === 1 ? "" : "s"} available
              </p>
            ) : leaseStatus === "draft" || leaseStatus === "sent" ? (
              <p className="text-sm text-muted-foreground">
                Lease is being prepared by your landlord
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Documents will appear when your landlord uploads them
              </p>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href="/portal/lease">View lease</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Button asChild>
        <Link href="/portal/maintenance">Submit maintenance request</Link>
      </Button>
    </div>
  );
}
