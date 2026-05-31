import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  properties,
  rentPaymentClaims,
  rentPayments,
  tenants,
  users,
} from "@/lib/db/schema";

export async function getPendingClaimsForLandlord() {
  const tenantUser = alias(users, "tenant_user");

  return db
    .select({
      id: rentPaymentClaims.id,
      reference: rentPaymentClaims.reference,
      amount: rentPaymentClaims.amount,
      paidDate: rentPaymentClaims.paidDate,
      submittedAt: rentPaymentClaims.submittedAt,
      tenantNotes: rentPaymentClaims.tenantNotes,
      rentPaymentId: rentPaymentClaims.rentPaymentId,
      dueDate: rentPayments.dueDate,
      chargeAmount: rentPayments.amount,
      tenantName: tenantUser.name,
      propertyCode: properties.propertyCode,
      location: properties.location,
    })
    .from(rentPaymentClaims)
    .innerJoin(rentPayments, eq(rentPaymentClaims.rentPaymentId, rentPayments.id))
    .innerJoin(tenants, eq(rentPaymentClaims.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
    .where(eq(rentPaymentClaims.status, "pending_review"))
    .orderBy(desc(rentPaymentClaims.submittedAt));
}

export async function getPendingClaimsCount() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rentPaymentClaims)
    .where(eq(rentPaymentClaims.status, "pending_review"));
  return row?.count ?? 0;
}

export async function getClaimsForTenant(tenantId: string) {
  return db
    .select({
      id: rentPaymentClaims.id,
      rentPaymentId: rentPaymentClaims.rentPaymentId,
      reference: rentPaymentClaims.reference,
      amount: rentPaymentClaims.amount,
      paidDate: rentPaymentClaims.paidDate,
      status: rentPaymentClaims.status,
      submittedAt: rentPaymentClaims.submittedAt,
      landlordNotes: rentPaymentClaims.landlordNotes,
      dueDate: rentPayments.dueDate,
    })
    .from(rentPaymentClaims)
    .innerJoin(rentPayments, eq(rentPaymentClaims.rentPaymentId, rentPayments.id))
    .where(eq(rentPaymentClaims.tenantId, tenantId))
    .orderBy(desc(rentPaymentClaims.submittedAt));
}

export async function getPendingClaimForPayment(rentPaymentId: string) {
  const [row] = await db
    .select({
      id: rentPaymentClaims.id,
      status: rentPaymentClaims.status,
    })
    .from(rentPaymentClaims)
    .where(
      and(
        eq(rentPaymentClaims.rentPaymentId, rentPaymentId),
        eq(rentPaymentClaims.status, "pending_review")
      )
    )
    .limit(1);
  return row ?? null;
}

export type ReferenceMatch = {
  type: "payment" | "claim";
  id: string;
  rentPaymentId: string;
  reference: string | null;
  amount: number;
  dueDate: Date;
  status: string;
  tenantName: string | null;
  propertyCode: string;
  location: string;
  claimId?: string;
};

export async function searchByReference(query: string): Promise<ReferenceMatch[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const pattern = `%${term}%`;
  const tenantUser = alias(users, "tenant_user");

  const unpaidPayments = await db
    .select({
      id: rentPayments.id,
      reference: rentPayments.reference,
      amount: rentPayments.amount,
      dueDate: rentPayments.dueDate,
      status: rentPayments.status,
      tenantName: tenantUser.name,
      propertyCode: properties.propertyCode,
      location: properties.location,
    })
    .from(rentPayments)
    .innerJoin(tenants, eq(rentPayments.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
    .where(
      and(
        inArray(rentPayments.status, ["pending", "overdue", "partial"]),
        or(
          ilike(rentPayments.reference, pattern),
          ilike(properties.propertyCode, pattern),
          sql`${properties.propertyCode} ILIKE ${"%" + term.replace(/\s/g, "%") + "%"}`
        )
      )
    )
    .orderBy(desc(rentPayments.dueDate))
    .limit(10);

  const pendingClaims = await db
    .select({
      claimId: rentPaymentClaims.id,
      rentPaymentId: rentPaymentClaims.rentPaymentId,
      reference: rentPaymentClaims.reference,
      amount: rentPaymentClaims.amount,
      dueDate: rentPayments.dueDate,
      status: rentPaymentClaims.status,
      tenantName: tenantUser.name,
      propertyCode: properties.propertyCode,
      location: properties.location,
    })
    .from(rentPaymentClaims)
    .innerJoin(rentPayments, eq(rentPaymentClaims.rentPaymentId, rentPayments.id))
    .innerJoin(tenants, eq(rentPaymentClaims.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
    .where(
      and(
        eq(rentPaymentClaims.status, "pending_review"),
        or(
          ilike(rentPaymentClaims.reference, pattern),
          ilike(properties.propertyCode, pattern)
        )
      )
    )
    .orderBy(desc(rentPaymentClaims.submittedAt))
    .limit(10);

  const paymentMatches: ReferenceMatch[] = unpaidPayments.map((p) => ({
    type: "payment",
    id: p.id,
    rentPaymentId: p.id,
    reference: p.reference,
    amount: p.amount,
    dueDate: p.dueDate,
    status: p.status,
    tenantName: p.tenantName,
    propertyCode: p.propertyCode,
    location: p.location,
  }));

  const claimMatches: ReferenceMatch[] = pendingClaims.map((c) => ({
    type: "claim",
    id: c.claimId,
    rentPaymentId: c.rentPaymentId,
    reference: c.reference,
    amount: c.amount,
    dueDate: c.dueDate,
    status: c.status,
    tenantName: c.tenantName,
    propertyCode: c.propertyCode,
    location: c.location,
    claimId: c.claimId,
  }));

  // Dedupe by rentPaymentId — prefer claims
  const seen = new Set<string>();
  const combined: ReferenceMatch[] = [];

  for (const match of [...claimMatches, ...paymentMatches]) {
    if (seen.has(match.rentPaymentId)) continue;
    seen.add(match.rentPaymentId);
    combined.push(match);
  }

  return combined.slice(0, 10);
}
