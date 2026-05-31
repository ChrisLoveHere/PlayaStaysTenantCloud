import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PrintReceiptButton } from "@/components/rent/print-receipt-button";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { buildCommissionStatementHtml } from "@/lib/email/templates";
import { getCommissionsForAgent } from "@/lib/queries/leases";

export default async function CommissionStatementPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "agent") redirect("/login");

  const profile = await getAgentProfileByUserId(session.user.id);
  if (!profile) redirect("/agent");

  const commissions = await getCommissionsForAgent(profile.id);
  const pendingTotal = commissions
    .filter((c) => c.status === "pending")
    .reduce((s, c) => s + c.amount, 0);
  const paidTotal = commissions
    .filter((c) => c.status === "paid")
    .reduce((s, c) => s + c.amount, 0);

  const html = buildCommissionStatementHtml({
    agentName: session.user.name ?? "Agent",
    generatedAt: new Date(),
    pendingTotal,
    paidTotal,
    items: commissions.map((c) => ({
      propertyCode: c.propertyCode,
      tenantName: c.tenantName ?? "Tenant",
      amount: c.amount,
      status: c.status,
      createdAt: c.createdAt,
      paidAt: c.paidAt,
    })),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/agent/commissions"
            className="text-sm text-primary hover:underline print:hidden"
          >
            ← Back to commissions
          </Link>
          <PrintReceiptButton />
        </div>
        <div
          className="rounded-xl border bg-card p-6 shadow-sm ring-1 ring-border/60"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
