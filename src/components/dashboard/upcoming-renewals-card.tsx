import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLocationLabel } from "@/lib/constants/locations";

type RenewalRow = {
  id: string;
  endDate: Date;
  propertyCode: string;
  location: string;
  tenantName: string | null;
};

export function UpcomingRenewalsCard({ items }: { items: RenewalRow[] }) {
  if (items.length === 0) return null;

  return (
    <Card className="mt-6 shadow-sm ring-1 ring-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Leases expiring soon</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/landlord/leases">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="divide-y text-sm">
          {items.map((lease) => {
            const daysLeft = Math.ceil(
              (new Date(lease.endDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            );
            return (
              <li
                key={lease.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <span className="font-mono font-medium">{lease.propertyCode}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {lease.tenantName} · {getLocationLabel(lease.location)}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {new Date(lease.endDate).toLocaleDateString("en-US")} (
                  {daysLeft}d)
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
