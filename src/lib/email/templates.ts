import { formatMXN } from "@/lib/utils/format";

const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
  <body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
    <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
      <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.05em;">PlayaStays</p>
      <h1 style="font-size: 20px; margin: 0 0 16px;">${title}</h1>
      ${body}
      <p style="margin-top: 24px; font-size: 12px; color: #666;">
        <a href="${appUrl}">${appUrl.replace(/^https?:\/\//, "")}</a>
      </p>
    </div>
  </body>
</html>`;
}

export function overdueRentTenantEmail(input: {
  tenantName: string;
  propertyCode: string;
  amount: number;
  dueDate: Date;
}) {
  const due = input.dueDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return {
    subject: `Rent overdue — ${input.propertyCode}`,
    html: layout(
      "Rent payment overdue",
      `<p>Hi ${input.tenantName},</p>
       <p>Your rent payment of <strong>${formatMXN(input.amount)}</strong> for
       <strong>${input.propertyCode}</strong> was due on ${due} and is now overdue.</p>
       <p>Please submit payment via SPEI and include your property code in the reference.</p>
       <p><a href="${appUrl}/portal/payments">View payment details</a></p>`
    ),
  };
}

export function overdueRentLandlordEmail(input: {
  tenantName: string;
  propertyCode: string;
  amount: number;
  dueDate: Date;
}) {
  const due = input.dueDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return {
    subject: `Overdue rent — ${input.tenantName} (${input.propertyCode})`,
    html: layout(
      "Overdue rent alert",
      `<p>Rent of <strong>${formatMXN(input.amount)}</strong> from
       <strong>${input.tenantName}</strong> at <strong>${input.propertyCode}</strong>
       was due ${due} and remains unpaid.</p>
       <p><a href="${appUrl}/landlord/rent">Review rent payments</a></p>`
    ),
  };
}

export function leaseRenewalEmail(input: {
  recipientName: string;
  tenantName: string;
  propertyCode: string;
  endDate: Date;
  daysUntilEnd: number;
  forLandlord: boolean;
}) {
  const end = input.endDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const title =
    input.daysUntilEnd <= 30
      ? "Lease renewal — 30 days remaining"
      : "Lease renewal — 60 days remaining";

  const intro = input.forLandlord
    ? `<p>The lease for <strong>${input.tenantName}</strong> at
       <strong>${input.propertyCode}</strong> ends on ${end}
       (${input.daysUntilEnd} days).</p>
       <p>Consider reaching out about renewal terms.</p>
       <p><a href="${appUrl}/landlord/leases">View leases</a></p>`
    : `<p>Hi ${input.recipientName},</p>
       <p>Your lease for <strong>${input.propertyCode}</strong> ends on ${end}
       (${input.daysUntilEnd} days remaining).</p>
       <p>Contact your landlord if you would like to discuss renewal.</p>
       <p><a href="${appUrl}/portal/lease">View your lease</a></p>`;

  return {
    subject: `${title} — ${input.propertyCode}`,
    html: layout(title, intro),
  };
}
