import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCommissionsForLandlord } from "@/lib/queries/leases";
import { buildCsv } from "@/lib/utils/csv";
import { formatMXN } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const commissions = await getCommissionsForLandlord();
  const csv = buildCsv(
    ["Agent", "Tenant", "Property", "Amount (MXN)", "Rate", "Type", "Status", "Paid date", "Created"],
    commissions.map((c) => [
      c.agentName ?? "",
      c.tenantName ?? "",
      c.propertyCode,
      formatMXN(c.amount).replace(/^\$/, ""),
      c.rate != null ? `${c.rate}%` : "",
      c.type,
      c.status,
      c.paidAt ? new Date(c.paidAt).toISOString().slice(0, 10) : "",
      new Date(c.createdAt).toISOString().slice(0, 10),
    ])
  );

  const filename = `commissions-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
