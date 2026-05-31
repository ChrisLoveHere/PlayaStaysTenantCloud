import { getDocumentsForEntity } from "@/lib/queries/documents";
import { getTenantLeaseForUser } from "@/lib/queries/leases";
import { getClaimsForTenant } from "@/lib/queries/rent-claims";
import {
  getMaintenanceForTenant,
  getRentPaymentsForTenant,
  getTenantByUserId,
} from "@/lib/queries/rent-maintenance";

export async function getTenantDashboardSummary(userId: string) {
  const tenant = await getTenantByUserId(userId);
  if (!tenant) return null;

  const [payments, claims, maintenance, leaseData] = await Promise.all([
    getRentPaymentsForTenant(tenant.id),
    getClaimsForTenant(tenant.id),
    getMaintenanceForTenant(tenant.id),
    getTenantLeaseForUser(userId),
  ]);

  const unpaid = payments.filter((p) =>
    ["pending", "overdue", "partial"].includes(p.status)
  );
  const pendingClaims = claims.filter((c) => c.status === "pending_review");
  const openMaintenance = maintenance.filter(
    (m) => m.status === "open" || m.status === "in_progress"
  );

  let leaseDocCount = 0;
  let leaseStatus: string | null = null;
  if (leaseData?.lease) {
    leaseStatus = leaseData.lease.status;
    const docs = await getDocumentsForEntity("lease", leaseData.lease.id);
    leaseDocCount = docs.length + (leaseData.lease.documentUrl ? 1 : 0);
  }

  return {
    propertyCode: tenant.propertyCode,
    unpaidCount: unpaid.length,
    unpaidTotal: unpaid.reduce((s, p) => s + p.amount, 0),
    pendingClaimsCount: pendingClaims.length,
    openMaintenanceCount: openMaintenance.length,
    inProgressMaintenanceCount: maintenance.filter(
      (m) => m.status === "in_progress"
    ).length,
    leaseDocCount,
    leaseStatus,
  };
}
