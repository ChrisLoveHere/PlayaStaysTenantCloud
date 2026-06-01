import { getLocationLabel } from "@/lib/constants/locations";
import { formatMXN, formatPropertyAddress } from "@/lib/utils/format";

export type LeaseTenantProfile = {
  name: string;
  email: string;
  phone: string | null;
  currentAddress: string | null;
  occupants: number | null;
  pets: string | null;
  employment: string | null;
  income: number | null;
};

export type LeasePropertyProfile = {
  propertyCode: string;
  location: string;
  address: {
    calle: string;
    colonia: string;
    ciudad: string;
    estado: string;
    cp: string;
    pais?: string | null;
  };
  description: string | null;
  amenities: string | null;
};

export type LeaseSignature = {
  name: string;
  imageDataUrl: string;
  signedAt: Date;
};

export type LeaseTemplateInput = LeasePropertyProfile & {
  leaseId: string;
  tenant: LeaseTenantProfile;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  signature?: LeaseSignature;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatIncome(cents: number | null): string {
  if (cents == null) return "Not provided";
  return `${formatMXN(cents)}/month (declared)`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildLeaseHtml(input: LeaseTemplateInput): string {
  const start = formatDate(input.startDate);
  const end = formatDate(input.endDate);
  const address = formatPropertyAddress(input.address);
  const city = getLocationLabel(input.location);
  const tenant = input.tenant;
  const ref = input.leaseId.slice(0, 8).toUpperCase();

  const tenantDetails = [
    tenant.phone ? `Phone: ${escapeHtml(tenant.phone)}` : null,
    tenant.currentAddress
      ? `Current address: ${escapeHtml(tenant.currentAddress)}`
      : null,
    tenant.occupants != null
      ? `Occupants: ${tenant.occupants}`
      : null,
    tenant.pets ? `Pets: ${escapeHtml(tenant.pets)}` : null,
    tenant.employment
      ? `Employment: ${escapeHtml(tenant.employment)}`
      : null,
    `Declared income: ${formatIncome(tenant.income)}`,
  ]
    .filter(Boolean)
    .map((line) => `<li>${line}</li>`)
    .join("");

  const amenitiesBlock = input.amenities
    ? `<p><strong>Amenities:</strong> ${escapeHtml(input.amenities)}</p>`
    : "";
  const descriptionBlock = input.description
    ? `<p>${escapeHtml(input.description)}</p>`
    : "";

  const tenantSigBlock = input.signature
    ? `<div>
        <img src="${input.signature.imageDataUrl}" alt="Tenant signature" style="max-height:64px;max-width:220px;display:block;" />
        <div class="sig-line">${escapeHtml(input.signature.name)}</div>
        <p style="margin-top:4px;font-size:13px;color:#555;">Signed ${formatDate(input.signature.signedAt)}</p>
      </div>`
    : `<div>
        <div class="sig-line">Tenant signature / date</div>
        <p style="margin-top:8px;font-size:13px;">${escapeHtml(tenant.name)}</p>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Residential Lease — ${escapeHtml(input.propertyCode)}</title>
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
  <p class="meta">${escapeHtml(city)}, Quintana Roo, México · Ref ${ref}</p>

  <p>This Residential Lease Agreement ("Agreement") is entered into between the Landlord and the Tenant named below for the property identified as <strong>${escapeHtml(input.propertyCode)}</strong>.</p>

  <h2>1. Parties</h2>
  <p><strong>Landlord:</strong> PlayaStays Properties (landlord of record)</p>
  <p><strong>Tenant:</strong> ${escapeHtml(tenant.name)} (${escapeHtml(tenant.email)})</p>
  <ul>${tenantDetails}</ul>

  <h2>2. Property</h2>
  <p>${escapeHtml(address)}<br />${escapeHtml(city)}, Quintana Roo</p>
  ${descriptionBlock}
  ${amenitiesBlock}

  <h2>3. Term</h2>
  <p>The lease term begins on <strong>${start}</strong> and ends on <strong>${end}</strong>, unless terminated earlier in accordance with this Agreement.</p>

  <h2>4. Rent</h2>
  <p>Monthly rent is <strong>${formatMXN(input.monthlyRent)}</strong>, payable in advance via SPEI bank transfer on or before the first day of each month. The tenant must include the property code <strong>${escapeHtml(input.propertyCode)}</strong> in the payment reference.</p>

  <h2>5. Security deposit</h2>
  <p>A refundable security deposit of <strong>${formatMXN(input.securityDeposit)}</strong> is due before move-in. Deductions may apply for unpaid rent, damages beyond normal wear, or breach of this Agreement.</p>

  <h2>6. Use & maintenance</h2>
  <ul>
    <li>The property shall be used solely as a private residence${tenant.occupants != null ? ` by up to ${tenant.occupants} occupant(s)` : ""}.</li>
    <li>The tenant shall maintain the property in good condition and report maintenance issues promptly through the tenant portal.</li>
    <li>Subletting or assignment requires written landlord approval.</li>
    ${tenant.pets ? `<li>Pets: ${escapeHtml(tenant.pets)}. Additional pet rules may apply as agreed in writing.</li>` : "<li>No pets unless approved in writing by the Landlord.</li>"}
  </ul>

  <h2>7. Governing law</h2>
  <p>This Agreement is governed by the laws of Mexico and the state of Quintana Roo.</p>

  <div class="signatures">
    <div>
      <div class="sig-line">Landlord signature / date</div>
      <p style="margin-top:8px;font-size:13px;">PlayaStays Properties</p>
    </div>
    ${tenantSigBlock}
  </div>
</body>
</html>`;
}
