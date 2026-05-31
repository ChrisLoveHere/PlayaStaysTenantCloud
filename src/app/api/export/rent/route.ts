import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRentPaymentsForLandlord } from "@/lib/queries/rent-maintenance";
import { buildCsv } from "@/lib/utils/csv";
import { formatMXN, rentPaymentStatusLabel } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payments = await getRentPaymentsForLandlord();
  const csv = buildCsv(
    [
      "Property",
      "Tenant",
      "Amount (MXN)",
      "Due date",
      "Paid date",
      "Status",
      "Reference",
      "Method",
      "Notes",
    ],
    payments.map((p) => [
      p.propertyCode,
      p.tenantName ?? "",
      formatMXN(p.amount).replace(/^\$/, ""),
      p.dueDate ? new Date(p.dueDate).toISOString().slice(0, 10) : "",
      p.paidDate ? new Date(p.paidDate).toISOString().slice(0, 10) : "",
      rentPaymentStatusLabel(p.status),
      p.reference ?? "",
      p.paymentMethod ?? "",
      p.notes ?? "",
    ])
  );

  const filename = `rent-payments-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
