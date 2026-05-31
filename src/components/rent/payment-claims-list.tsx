import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMXN, rentClaimStatusLabel } from "@/lib/utils/format";

type ClaimRow = {
  id: string;
  reference: string;
  amount: number;
  paidDate: Date;
  status: string;
  submittedAt: Date;
  landlordNotes: string | null;
  dueDate: Date;
};

export function PaymentClaimsList({ claims }: { claims: ClaimRow[] }) {
  if (claims.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your payment reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {claims.map((claim) => (
          <div key={claim.id} className="rounded-lg border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {formatMXN(claim.amount)} · ref{" "}
                <span className="font-mono">{claim.reference}</span>
              </p>
              <Badge
                variant={
                  claim.status === "rejected"
                    ? "destructive"
                    : claim.status === "approved"
                      ? "default"
                      : "secondary"
                }
              >
                {rentClaimStatusLabel(claim.status)}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Reported {new Date(claim.submittedAt).toLocaleString("en-US")} ·
              Due {new Date(claim.dueDate).toLocaleDateString("en-US")} · Paid{" "}
              {new Date(claim.paidDate).toLocaleDateString("en-US")}
            </p>
            {claim.status === "rejected" && claim.landlordNotes && (
              <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-destructive">
                {claim.landlordNotes}
              </p>
            )}
            {claim.status === "pending_review" && (
              <p className="mt-2 text-muted-foreground">
                Your landlord is reviewing this report.
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
