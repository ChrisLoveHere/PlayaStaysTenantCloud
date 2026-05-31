import { and, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  applications,
  documents,
  leases,
  properties,
  prospects,
  rentPayments,
  tenants,
  users,
} from "@/lib/db/schema";
import type { DocumentEntityType } from "@/lib/db/schema";

export type DocumentRow = {
  id: string;
  entityType: string;
  entityId: string;
  name: string;
  url: string;
  mimeType: string | null;
  createdAt: Date;
  uploadedByName: string | null;
};

export async function getDocumentsForEntity(
  entityType: DocumentEntityType,
  entityId: string
): Promise<DocumentRow[]> {
  const uploader = alias(users, "uploader");

  return db
    .select({
      id: documents.id,
      entityType: documents.entityType,
      entityId: documents.entityId,
      name: documents.name,
      url: documents.url,
      mimeType: documents.mimeType,
      createdAt: documents.createdAt,
      uploadedByName: uploader.name,
    })
    .from(documents)
    .leftJoin(uploader, eq(documents.uploadedById, uploader.id))
    .where(
      and(
        eq(documents.entityType, entityType),
        eq(documents.entityId, entityId)
      )
    )
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentsGroupedByEntity(
  entityType: DocumentEntityType,
  entityIds: string[]
): Promise<Map<string, DocumentRow[]>> {
  const map = new Map<string, DocumentRow[]>();
  if (entityIds.length === 0) return map;

  const uploader = alias(users, "uploader");
  const rows = await db
    .select({
      id: documents.id,
      entityType: documents.entityType,
      entityId: documents.entityId,
      name: documents.name,
      url: documents.url,
      mimeType: documents.mimeType,
      createdAt: documents.createdAt,
      uploadedByName: uploader.name,
    })
    .from(documents)
    .leftJoin(uploader, eq(documents.uploadedById, uploader.id))
    .where(
      and(
        eq(documents.entityType, entityType),
        inArray(documents.entityId, entityIds)
      )
    )
    .orderBy(desc(documents.createdAt));

  for (const row of rows) {
    const list = map.get(row.entityId) ?? [];
    list.push(row);
    map.set(row.entityId, list);
  }

  return map;
}

export async function getDocumentById(documentId: string) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);
  return doc ?? null;
}

export async function getApplicationIdsForProspect(prospectId: string) {
  const rows = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.prospectId, prospectId));
  return rows.map((r) => r.id);
}

export async function getLeaseIdForTenantUser(userId: string) {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.userId, userId))
    .limit(1);

  if (!tenant) return null;

  const [lease] = await db
    .select({ id: leases.id })
    .from(leases)
    .where(eq(leases.tenantId, tenant.id))
    .orderBy(desc(leases.createdAt))
    .limit(1);

  return lease?.id ?? null;
}

export async function getProspectIdForUser(userId: string) {
  const [prospect] = await db
    .select({ id: prospects.id })
    .from(prospects)
    .where(eq(prospects.userId, userId))
    .limit(1);
  return prospect?.id ?? null;
}

export async function getRentPaymentForReceipt(paymentId: string) {
  const tenantUser = alias(users, "tenant_user");

  const [row] = await db
    .select({
      id: rentPayments.id,
      amount: rentPayments.amount,
      dueDate: rentPayments.dueDate,
      paidDate: rentPayments.paidDate,
      status: rentPayments.status,
      reference: rentPayments.reference,
      paymentMethod: rentPayments.paymentMethod,
      propertyCode: properties.propertyCode,
      tenantUserId: tenants.userId,
      tenantName: tenantUser.name,
    })
    .from(rentPayments)
    .innerJoin(tenants, eq(rentPayments.tenantId, tenants.id))
    .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
    .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
    .where(eq(rentPayments.id, paymentId))
    .limit(1);

  return row ?? null;
}
