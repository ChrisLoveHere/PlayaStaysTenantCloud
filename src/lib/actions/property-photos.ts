"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { propertyPhotos } from "@/lib/db/schema";
import { saveUploadedFiles } from "@/lib/utils/upload";

export type PropertyPhotoActionState = {
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

export async function uploadPropertyPhotos(
  propertyId: string,
  _prev: PropertyPhotoActionState,
  formData: FormData
): Promise<PropertyPhotoActionState> {
  await requireLandlord();

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 10);

  if (files.length === 0) {
    return { error: "Select at least one image." };
  }

  const uploads = await saveUploadedFiles(files, "property-photos");
  const existing = await db
    .select({ sortOrder: propertyPhotos.sortOrder })
    .from(propertyPhotos)
    .where(eq(propertyPhotos.propertyId, propertyId));

  let nextOrder =
    existing.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;

  for (const file of uploads) {
    await db.insert(propertyPhotos).values({
      propertyId,
      url: file.url,
      caption: file.name,
      sortOrder: nextOrder++,
    });
  }

  revalidatePath(`/landlord/properties/${propertyId}`);
  revalidatePath("/portal/properties");
  revalidatePath(`/portal/properties/${propertyId}`);
  return { success: `Uploaded ${uploads.length} photo(s).` };
}

export async function deletePropertyPhoto(photoId: string, propertyId: string) {
  await requireLandlord();
  await db.delete(propertyPhotos).where(eq(propertyPhotos.id, photoId));
  revalidatePath(`/landlord/properties/${propertyId}`);
  revalidatePath("/portal/properties");
  revalidatePath(`/portal/properties/${propertyId}`);
}
