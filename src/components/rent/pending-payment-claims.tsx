import { approvePaymentClaim } from "@/lib/actions/rent-claims";
import { RejectClaimForm } from "@/components/rent/reject-claim-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLocationLabel } from "@/lib/constants/locations";
import { formatMXN } from "@/lib/utils/format";

type PendingClaim = {
  id: string;
  reference: string;
  amount: number;
  paidDate: Date;
  submittedAt: Date;
  tenantNotes: string | null;
  dueDate: Date;
  chargeAmount: number;
  tenantName: string | null;
  propertyCode: string;
  location: string;
};

export function PendingPaymentClaims({ items }: { items: PendingClaim[] }) {
  if (items.length === 0) return null;

  return (
    <Card className="border-teal-200 bg-teal-50/40 shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <CardTitle className="text-base">
          Pending payment reports ({items.length})
        </CardTitle>
        <CardDescription>
          Tenants reported SPEI transfers — approve to mark paid on their portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <ClaimRow key={item.id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}

async function ClaimRow({ item }: { item: PendingClaim }) {
  async function approve() {
    "use server";
    await approvePaymentClaim(item.id);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-1 text-sm">
        <p className="font-medium">
          {item.tenantName} ·{" "}
          <span className="font-mono">{item.propertyCode}</span>
        </p>
        <p className="text-muted-foreground">
          {getLocationLabel(item.location)} · Due{" "}
          {new Date(item.dueDate).toLocaleDateString("en-US")} (
          {formatMXN(item.chargeAmount)})
        </p>
        <p>
          Reported {formatMXN(item.amount)} on{" "}
          {new Date(item.paidDate).toLocaleDateString("en-US")}
        </p>
        <p className="font-mono text-xs">Ref: {item.reference}</p>
        {item.tenantNotes && (
          <p className="text-muted-foreground">{item.tenantNotes}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <form action={approve}>
          <Button type="submit" size="sm">
            Approve & mark paid
          </Button>
        </form>
        <RejectClaimForm claimId={item.id} />
      </div>
    </div>
  );
}
