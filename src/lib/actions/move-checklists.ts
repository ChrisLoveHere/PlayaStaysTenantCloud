"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { insertDocumentRecord } from "@/lib/actions/documents";
import { db } from "@/lib/db";
import { moveChecklists, tenants } from "@/lib/db/schema";
import type { MoveChecklistType } from "@/lib/db/schema";
import { getMoveChecklistByType } from "@/lib/queries/move-checklists";
import { saveUploadedFiles } from "@/lib/utils/upload";
import { parseMXNToCents } from "@/lib/utils/format";
import { moveChecklistSchema } from "@/lib/validations/move-checklist";

export type MoveChecklistActionState = {
  error?: string;
  success?: string;
};

async function requireLandlord() {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function saveMoveChecklist(
  tenantId: string,
  _prev: MoveChecklistActionState,
  formData: FormData
): Promise<MoveChecklistActionState> {
  const session = await requireLandlord();

  const parsed = moveChecklistSchema.safeParse({
    type: formData.get("type"),
    depositHeld: formData.get("depositHeld") || undefined,
    depositReturned: formData.get("depositReturned") || undefined,
    deductionNotes: formData.get("deductionNotes") || undefined,
    conditionNotes: formData.get("conditionNotes"),
  });

  if (!parsed.success) {
    return { error: "Please fill in condition notes." };
  }

  const type = parsed.data.type as MoveChecklistType;
  const existing = await getMoveChecklistByType(tenantId, type);
  if (existing) {
    return { error: `A ${type.replace("_", "-")} checklist already exists.` };
  }

  const [tenant] = await db
    .select({ propertyId: tenants.propertyId })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) return { error: "Tenant not found." };

  const depositHeld = parsed.data.depositHeld
    ? parseMXNToCents(parsed.data.depositHeld)
    : null;
  const depositReturned = parsed.data.depositReturned
    ? parseMXNToCents(parsed.data.depositReturned)
    : null;

  const [checklist] = await db
    .insert(moveChecklists)
    .values({
      tenantId,
      type,
      depositHeld,
      depositReturned,
      deductionNotes: parsed.data.deductionNotes?.trim() || null,
      conditionNotes: parsed.data.conditionNotes.trim(),
      completedAt: new Date(),
      completedById: session.user.id,
    })
    .returning({ id: moveChecklists.id });

  const photoFiles = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 10);

  if (checklist && photoFiles.length > 0) {
    const uploads = await saveUploadedFiles(photoFiles, "move-checklists");
    for (const file of uploads) {
      await insertDocumentRecord({
        entityType: "move_checklist",
        entityId: checklist.id,
        name: file.name,
        url: file.url,
        mimeType: file.mimeType,
        uploadedById: session.user.id,
      });
    }
  }

  if (type === "move_out") {
    await db
      .update(tenants)
      .set({ moveOutDate: new Date(), status: "past", updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));
  }

  revalidatePath(`/landlord/tenants/${tenantId}`);
  revalidatePath("/landlord/tenants");
  return { success: `${type === "move_in" ? "Move-in" : "Move-out"} checklist saved.` };
}
