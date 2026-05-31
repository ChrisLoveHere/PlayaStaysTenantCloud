import Link from "next/link";
import { getPendingClaimsCount } from "@/lib/queries/rent-claims";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export async function PendingPaymentClaimsCard() {
  const count = await getPendingClaimsCount();
  if (count === 0) return null;

  return (
    <Card className="mt-6 border-teal-200 bg-teal-50/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Payment reports awaiting review</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{count}</strong> tenant payment
          {count === 1 ? " report" : " reports"} need confirmation.
        </p>
        <Button asChild size="sm">
          <Link href="/landlord/rent">Review on rent page</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
