import { Badge } from "@/components/ui/badge";
import { evaluateIncomeVsRent } from "@/lib/utils/income-screening";

export function IncomeScreeningBadge({
  incomeCents,
  monthlyRentCents,
}: {
  incomeCents: number | null | undefined;
  monthlyRentCents: number;
}) {
  const result = evaluateIncomeVsRent(incomeCents, monthlyRentCents);

  if (result.ratio == null && !incomeCents) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        No income
      </Badge>
    );
  }

  return (
    <Badge
      variant={result.meetsRequirement ? "secondary" : "destructive"}
      title={result.message}
    >
      {result.meetsRequirement ? "3× rent OK" : "Below 3× rent"}
    </Badge>
  );
}
