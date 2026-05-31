import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { PrintReceiptButton } from "@/components/rent/print-receipt-button";
import { buildReceiptHtml } from "@/lib/email/templates";
import { getRentPaymentForReceipt } from "@/lib/queries/documents";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const payment = await getRentPaymentForReceipt(id);

  if (!payment || payment.status !== "paid" || !payment.paidDate) {
    notFound();
  }

  if (
    session.user.role !== "landlord" &&
    payment.tenantUserId !== session.user.id
  ) {
    notFound();
  }

  const html = buildReceiptHtml({
    tenantName: payment.tenantName ?? "Tenant",
    propertyCode: payment.propertyCode,
    amount: payment.amount,
    dueDate: payment.dueDate,
    paidDate: payment.paidDate,
    reference: payment.reference,
    paymentMethod: payment.paymentMethod,
    paymentId: payment.id,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/portal/payments"
            className="text-sm text-primary hover:underline print:hidden"
          >
            ← Back to payments
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
