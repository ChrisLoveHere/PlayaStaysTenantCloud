"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { assertDocumentAccess } from "@/lib/documents/access";
import { db } from "@/lib/db";
import { documents, leases } from "@/lib/db/schema";
import type { DocumentEntityType } from "@/lib/db/schema";
import { getDocumentById } from "@/lib/queries/documents";
import { saveUploadedFile } from "@/lib/utils/upload";
import { uploadDocumentSchema } from "@/lib/validations/documents";

export type DocumentActionState = {
  error?: string;
  success?: string;
};

const UPLOAD_SUBFOLDERS: Record<DocumentEntityType, string> = {
  property: "properties",
  lease: "leases",
  application: "applications",
  prospect: "prospects",
  maintenance_request: "maintenance",
  move_checklist: "move-checklists",
};

function revalidateForEntity(entityType: DocumentEntityType, entityId: string) {
  switch (entityType) {
    case "property":
      revalidatePath(`/landlord/properties/${entityId}`);
      break;
    case "lease":
      revalidatePath(`/landlord/leases/${entityId}`);
      revalidatePath("/landlord/leases");
      revalidatePath("/portal/lease");
      break;
    case "application":
      revalidatePath(`/landlord/prospects/${entityId}`);
      revalidatePath("/landlord/prospects");
      revalidatePath("/portal/application");
      break;
    case "prospect":
      revalidatePath("/portal/application");
      revalidatePath("/portal/properties");
      break;
    case "maintenance_request":
      revalidatePath("/landlord/maintenance");
      revalidatePath("/portal/maintenance");
      break;
    case "move_checklist":
      revalidatePath("/landlord/tenants");
      break;
  }
}

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function insertDocumentRecord(input: {
  entityType: DocumentEntityType;
  entityId: string;
  name: string;
  url: string;
  mimeType: string | null;
  uploadedById: string;
}) {
  const [doc] = await db
    .insert(documents)
    .values({
      entityType: input.entityType,
      entityId: input.entityId,
      name: input.name,
      url: input.url,
      mimeType: input.mimeType,
      uploadedById: input.uploadedById,
    })
    .returning();

  if (input.entityType === "lease") {
    await db
      .update(leases)
      .set({ documentUrl: input.url, updatedAt: new Date() })
      .where(eq(leases.id, input.entityId));
  }

  return doc;
}

export async function uploadDocument(
  entityType: DocumentEntityType,
  entityId: string,
  _prev: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const session = await requireSession();

  const parsed = uploadDocumentSchema.safeParse({
    entityType,
    entityId,
    name: formData.get("name") || undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid document data." };
  }

  try {
    await assertDocumentAccess(session, entityType, entityId, "write");
  } catch {
    return { error: "You do not have permission to upload here." };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Please select a file." };
  }

  const url = await saveUploadedFile(file, UPLOAD_SUBFOLDERS[entityType]);
  const name = parsed.data.name?.trim() || file.name || "Document";

  await insertDocumentRecord({
    entityType,
    entityId,
    name,
    url,
    mimeType: file.type || null,
    uploadedById: session.user.id,
  });

  revalidateForEntity(entityType, entityId);
  return { success: "Document uploaded." };
}

async function syncLeaseDocumentUrl(leaseId: string) {
  const [latest] = await db
    .select({ url: documents.url })
    .from(documents)
    .where(
      and(eq(documents.entityType, "lease"), eq(documents.entityId, leaseId))
    )
    .orderBy(desc(documents.createdAt))
    .limit(1);

  await db
    .update(leases)
    .set({
      documentUrl: latest?.url ?? null,
      updatedAt: new Date(),
    })
    .where(eq(leases.id, leaseId));
}

export async function deleteDocument(
  documentId: string,
  _prev: DocumentActionState,
  _formData: FormData
): Promise<DocumentActionState> {
  const session = await requireSession();
  const doc = await getDocumentById(documentId);

  if (!doc) return { error: "Document not found." };

  const entityType = doc.entityType as DocumentEntityType;
  if (!UPLOAD_SUBFOLDERS[entityType]) {
    return { error: "Invalid document." };
  }

  try {
    await assertDocumentAccess(session, entityType, doc.entityId, "write");
  } catch {
    return { error: "You do not have permission to delete this document." };
  }

  await db.delete(documents).where(eq(documents.id, documentId));

  if (entityType === "lease") {
    await syncLeaseDocumentUrl(doc.entityId);
  }

  revalidateForEntity(entityType, doc.entityId);
  return { success: "Document deleted." };
}
