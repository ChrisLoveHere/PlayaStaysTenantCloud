/** Format MXN cents to display string */
export function formatMXN(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Parse peso amount string to cents */
export function parseMXNToCents(amount: string | number): number {
  if (typeof amount === "number") return Math.round(amount * 100);
  const cleaned = amount.replace(/[^0-9.]/g, "");
  return Math.round(parseFloat(cleaned || "0") * 100);
}

export function formatPropertyAddress(p: {
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  cp: string;
  pais?: string | null;
}): string {
  return `${p.calle}, ${p.colonia}, ${p.ciudad}, ${p.estado} ${p.cp}, ${p.pais ?? "México"}`;
}

export function applicationStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    new: "New",
    property_viewed: "Viewed Properties",
    applied: "Applied",
    screening: "Screening",
    approved: "Approved",
    lease_sent: "Lease Sent",
    lease_signed: "Lease Signed",
    moved_in: "Moved In",
    rejected: "Rejected",
  };
  return labels[stage] ?? stage;
}

export function propertyStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: "Available",
    occupied: "Occupied",
    maintenance: "Maintenance",
    off_market: "Off Market",
  };
  return labels[status] ?? status;
}

export function showingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    scheduled: "Scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show",
  };
  return labels[status] ?? status;
}

export function leaseStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    sent: "Sent",
    signed: "Signed",
    expired: "Expired",
    terminated: "Terminated",
  };
  return labels[status] ?? status;
}

export function commissionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
  };
  return labels[status] ?? status;
}

export function rentPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    overdue: "Overdue",
    partial: "Partial",
  };
  return labels[status] ?? status;
}

export function maintenanceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };
  return labels[status] ?? status;
}

export function maintenancePriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
  };
  return labels[priority] ?? priority;
}
