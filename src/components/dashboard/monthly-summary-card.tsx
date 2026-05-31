import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMXN } from "@/lib/utils/format";

type MonthlySummaryCardProps = {
  rentDueMonth: number;
  rentCollectedMonth: number;
  rentOutstandingMonth: number;
  collectionRate: number;
  vacancyRate: number;
  commissionsPendingTotal: number;
};

export function MonthlySummaryCard({
  rentDueMonth,
  rentCollectedMonth,
  rentOutstandingMonth,
  collectionRate,
  vacancyRate,
  commissionsPendingTotal,
}: MonthlySummaryCardProps) {
  return (
    <Card className="shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <CardTitle className="text-base">This month</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Rent due" value={formatMXN(rentDueMonth)} />
        <Row label="Collected" value={formatMXN(rentCollectedMonth)} />
        <Row label="Outstanding" value={formatMXN(rentOutstandingMonth)} />
        <Row label="Collection rate" value={`${collectionRate}%`} />
        <Row label="Vacancy rate" value={`${vacancyRate}%`} />
        <div className="flex items-center justify-between border-b border-border/60 py-2.5 last:border-0">
          <span className="text-muted-foreground">Commissions owed</span>
          <Link
            href="/landlord/commissions"
            className="font-medium tabular-nums text-primary hover:underline"
          >
            {formatMXN(commissionsPendingTotal)}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-2.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
