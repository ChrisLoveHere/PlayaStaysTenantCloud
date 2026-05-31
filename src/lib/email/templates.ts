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

export function applicationStageEmail(input: {
  prospectName: string;
  propertyCode: string;
  stageLabel: string;
}) {
  return {
    subject: `Application update — ${input.propertyCode}`,
    html: layout(
      "Application status updated",
      `<p>Hi ${input.prospectName},</p>
       <p>Your application for <strong>${input.propertyCode}</strong> is now:
       <strong>${input.stageLabel}</strong>.</p>
       <p><a href="${appUrl}/portal/application">View your application</a></p>`
    ),
  };
}

export function newApplicationLandlordEmail(input: {
  prospectName: string;
  prospectEmail: string;
  propertyCode: string;
  applicationId: string;
}) {
  return {
    subject: `New application — ${input.prospectName} (${input.propertyCode})`,
    html: layout(
      "New rental application",
      `<p><strong>${input.prospectName}</strong> (${input.prospectEmail}) applied for
       <strong>${input.propertyCode}</strong>.</p>
       <p><a href="${appUrl}/landlord/prospects/${input.applicationId}">Review application</a></p>`
    ),
  };
}

export function showingRequestLandlordEmail(input: {
  prospectName: string;
  propertyCode: string;
  agentName: string;
  scheduledAt: Date;
  notes: string | null;
}) {
  const when = input.scheduledAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return {
    subject: `Showing request — ${input.propertyCode}`,
    html: layout(
      "New showing request",
      `<p><strong>${input.prospectName}</strong> requested a showing for
       <strong>${input.propertyCode}</strong>.</p>
       <p><strong>When:</strong> ${when}<br/>
       <strong>Agent:</strong> ${input.agentName}</p>
       ${input.notes ? `<p><strong>Notes:</strong> ${input.notes}</p>` : ""}
       <p><a href="${appUrl}/landlord/showings">Review & confirm</a></p>`
    ),
  };
}

export function rentReceiptEmail(input: {
  tenantName: string;
  propertyCode: string;
  amount: number;
  paidDate: Date;
  reference: string | null;
  paymentMethod: string | null;
  receiptUrl: string;
}) {
  const paid = input.paidDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return {
    subject: `Rent receipt — ${input.propertyCode}`,
    html: layout(
      "Payment received",
      `<p>Hi ${input.tenantName},</p>
       <p>We received your rent payment of <strong>${formatMXN(input.amount)}</strong>
       for <strong>${input.propertyCode}</strong> on ${paid}.</p>
       ${input.reference ? `<p>Reference: <strong>${input.reference}</strong></p>` : ""}
       ${input.paymentMethod ? `<p>Method: ${input.paymentMethod}</p>` : ""}
       <p><a href="${input.receiptUrl}">View receipt</a></p>`
    ),
  };
}

export function buildReceiptHtml(input: {
  tenantName: string;
  propertyCode: string;
  amount: number;
  dueDate: Date;
  paidDate: Date;
  reference: string | null;
  paymentMethod: string | null;
  paymentId: string;
}) {
  const paid = input.paidDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const due = input.dueDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return layout(
    "Rent payment receipt",
    `<p><strong>Receipt #</strong> ${input.paymentId.slice(0, 8).toUpperCase()}</p>
     <p><strong>Tenant:</strong> ${input.tenantName}<br/>
     <strong>Property:</strong> ${input.propertyCode}</p>
     <table style="width:100%;margin:16px 0;border-collapse:collapse;">
       <tr><td style="padding:8px 0;color:#666;">Amount</td><td style="text-align:right;font-weight:600;">${formatMXN(input.amount)}</td></tr>
       <tr><td style="padding:8px 0;color:#666;">Due date</td><td style="text-align:right;">${due}</td></tr>
       <tr><td style="padding:8px 0;color:#666;">Paid date</td><td style="text-align:right;">${paid}</td></tr>
       ${input.paymentMethod ? `<tr><td style="padding:8px 0;color:#666;">Method</td><td style="text-align:right;">${input.paymentMethod}</td></tr>` : ""}
       ${input.reference ? `<tr><td style="padding:8px 0;color:#666;">Reference</td><td style="text-align:right;font-family:monospace;">${input.reference}</td></tr>` : ""}
     </table>
     <p style="font-size:12px;color:#666;">PlayaStays · Quintana Roo, Mexico · MXN</p>`
  );
}

export function showingReminderEmail(input: {
  recipientName: string;
  propertyCode: string;
  scheduledAt: Date;
  prospectName: string;
  agentName: string;
  forAgent: boolean;
}) {
  const when = input.scheduledAt.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const dashboardUrl = input.forAgent
    ? `${appUrl}/agent/showings`
    : `${appUrl}/portal/properties`;

  return {
    subject: `Showing reminder — ${input.propertyCode}`,
    html: layout(
      "Showing tomorrow",
      `<p>Hi ${input.recipientName},</p>
       <p>This is a reminder for a property showing at <strong>${input.propertyCode}</strong>
       scheduled for <strong>${when}</strong>.</p>
       <p><strong>Prospect:</strong> ${input.prospectName}<br/>
       <strong>Agent:</strong> ${input.agentName}</p>
       <p><a href="${dashboardUrl}">View details</a></p>`
    ),
  };
}

type CommissionLine = {
  propertyCode: string;
  tenantName: string;
  amount: number;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
};

export function buildCommissionStatementHtml(input: {
  agentName: string;
  generatedAt: Date;
  pendingTotal: number;
  paidTotal: number;
  items: CommissionLine[];
}) {
  const generated = input.generatedAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const rows = input.items
    .map((c) => {
      const date = (c.paidAt ?? c.createdAt).toLocaleDateString("en-US");
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${c.propertyCode}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${c.tenantName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${c.status}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${date}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatMXN(c.amount)}</td>
      </tr>`;
    })
    .join("");

  return layout(
    "Commission statement",
    `<p><strong>Agent:</strong> ${input.agentName}<br/>
     <strong>Generated:</strong> ${generated}</p>
     <table style="width:100%;margin:16px 0;border-collapse:collapse;font-size:14px;">
       <thead>
         <tr style="background:#f5f5f5;">
           <th style="padding:8px;text-align:left;">Property</th>
           <th style="padding:8px;text-align:left;">Tenant</th>
           <th style="padding:8px;text-align:left;">Status</th>
           <th style="padding:8px;text-align:left;">Date</th>
           <th style="padding:8px;text-align:right;">Amount</th>
         </tr>
       </thead>
       <tbody>${rows || `<tr><td colspan="5" style="padding:16px;color:#666;">No commissions yet.</td></tr>`}</tbody>
     </table>
     <table style="width:100%;margin-top:8px;">
       <tr><td style="padding:4px 0;color:#666;">Pending total</td><td style="text-align:right;font-weight:600;">${formatMXN(input.pendingTotal)}</td></tr>
       <tr><td style="padding:4px 0;color:#666;">Paid total</td><td style="text-align:right;font-weight:600;">${formatMXN(input.paidTotal)}</td></tr>
     </table>
     <p style="font-size:12px;color:#666;margin-top:24px;">PlayaStays · Quintana Roo, Mexico · MXN</p>`
  );
}

export function passwordResetEmail(input: { name: string; resetUrl: string }) {
  return {
    subject: "Reset your PlayaStays password",
    html: layout(
      "Password reset",
      `<p>Hi ${input.name},</p>
       <p>We received a request to reset your password. Click the link below to choose a new one. This link expires in 1 hour.</p>
       <p><a href="${input.resetUrl}">Reset password</a></p>
       <p>If you did not request this, you can ignore this email.</p>`
    ),
  };
}
