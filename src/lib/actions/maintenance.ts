"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { insertDocumentRecord } from "@/lib/actions/documents";
import { db } from "@/lib/db";
import { maintenanceRequests } from "@/lib/db/schema";
import type { MaintenanceStatus } from "@/lib/db/schema";
import { getTenantByUserId } from "@/lib/queries/rent-maintenance";
import { saveUploadedFiles } from "@/lib/utils/upload";
import {
  maintenanceRequestSchema,
  updateMaintenanceSchema,
} from "@/lib/validations/rent-maintenance";

export type MaintenanceActionState = {
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

export async function submitMaintenanceRequest(
  _prev: MaintenanceActionState,
  formData: FormData
): Promise<MaintenanceActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "tenant") {
    return { error: "Only tenants can submit maintenance requests." };
  }

  const tenant = await getTenantByUserId(session.user.id);
  if (!tenant || tenant.status !== "active") {
    return { error: "No active tenancy found." };
  }

  const parsed = maintenanceRequestSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    return { error: "Please fill in all required fields." };
  }

  const [request] = await db
    .insert(maintenanceRequests)
    .values({
      tenantId: tenant.id,
      propertyId: tenant.propertyId,
      title: parsed.data.title.trim(),
      description: parsed.data.description.trim(),
      priority: parsed.data.priority,
      status: "open",
    })
    .returning({ id: maintenanceRequests.id });

  const photoFiles = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 5);

  if (request && photoFiles.length > 0) {
    const uploads = await saveUploadedFiles(photoFiles, "maintenance");
    for (const file of uploads) {
      await insertDocumentRecord({
        entityType: "maintenance_request",
        entityId: request.id,
        name: file.name,
        url: file.url,
        mimeType: file.mimeType,
        uploadedById: session.user.id,
      });
    }
  }

  revalidatePath("/portal/maintenance");
  revalidatePath("/landlord/maintenance");
  revalidatePath("/landlord");
  return { success: "Maintenance request submitted." };
}

export async function updateMaintenanceStatus(
  requestId: string,
  _prev: MaintenanceActionState,
  formData: FormData
): Promise<MaintenanceActionState> {
  await requireLandlord();

  const parsed = updateMaintenanceSchema.safeParse({
    status: formData.get("status"),
  });

  if (!parsed.success) return { error: "Invalid status." };

  const status = parsed.data.status as MaintenanceStatus;
  const resolvedAt =
    status === "resolved" || status === "closed" ? new Date() : null;

  await db
    .update(maintenanceRequests)
    .set({ status, resolvedAt })
    .where(eq(maintenanceRequests.id, requestId));

  revalidatePath("/landlord/maintenance");
  revalidatePath("/portal/maintenance");
  revalidatePath("/landlord");
  return { success: "Request updated." };
}
