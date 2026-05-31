import { getLocationLabel } from "@/lib/constants/locations";
import { formatMXN, formatPropertyAddress } from "@/lib/utils/format";

export type LeaseTemplateInput = {
  propertyCode: string;
  location: string;
  address: {
    calle: string;
    colonia: string;
    ciudad: string;
    estado: string;
    cp: string;
  };
  tenantName: string;
  tenantEmail: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  leaseId: string;
};

export function buildLeaseHtml(input: LeaseTemplateInput): string {
  const start = input.startDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const end = input.endDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const address = formatPropertyAddress(input.address);
  const city = getLocationLabel(input.location);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Residential Lease — ${input.propertyCode}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; line-height: 1.6; color: #111; max-width: 720px; margin: 0 auto; padding: 40px 24px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #555; font-size: 14px; margin-bottom: 32px; }
    h2 { font-size: 16px; margin-top: 28px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    p, li { font-size: 15px; }
    .signatures { margin-top: 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .sig-line { border-top: 1px solid #111; margin-top: 48px; padding-top: 8px; font-size: 14px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Residential Lease Agreement</h1>
  <p class="meta">${city}, Quintana Roo, México · Ref ${input.leaseId.slice(0, 8).toUpperCase()}</p>

  <p>This Residential Lease Agreement ("Agreement") is entered into between the Landlord and the Tenant named below for the property identified as <strong>${input.propertyCode}</strong>.</p>

  <h2>1. Parties</h2>
  <p><strong>Landlord:</strong> PlayaStays Properties (landlord of record)</p>
  <p><strong>Tenant:</strong> ${input.tenantName} (${input.tenantEmail})</p>

  <h2>2. Property</h2>
  <p>${address}<br />${city}, Quintana Roo</p>

  <h2>3. Term</h2>
  <p>The lease term begins on <strong>${start}</strong> and ends on <strong>${end}</strong>, unless terminated earlier in accordance with this Agreement.</p>

  <h2>4. Rent</h2>
  <p>Monthly rent is <strong>${formatMXN(input.monthlyRent)}</strong>, payable in advance via SPEI bank transfer on or before the first day of each month. The tenant must include the property code <strong>${input.propertyCode}</strong> in the payment reference.</p>

  <h2>5. Security deposit</h2>
  <p>A refundable security deposit of <strong>${formatMXN(input.securityDeposit)}</strong> is due before move-in. Deductions may apply for unpaid rent, damages beyond normal wear, or breach of this Agreement.</p>

  <h2>6. Use & maintenance</h2>
  <ul>
    <li>The property shall be used solely as a private residence.</li>
    <li>The tenant shall maintain the property in good condition and report maintenance issues promptly through the tenant portal.</li>
    <li>Subletting or assignment requires written landlord approval.</li>
  </ul>

  <h2>7. Governing law</h2>
  <p>This Agreement is governed by the laws of Mexico and the state of Quintana Roo.</p>

  <div class="signatures">
    <div>
      <div class="sig-line">Landlord signature / date</div>
    </div>
    <div>
      <div class="sig-line">Tenant signature / date</div>
      <p style="margin-top:8px;font-size:13px;">${input.tenantName}</p>
    </div>
  </div>
</body>
</html>`;
}
