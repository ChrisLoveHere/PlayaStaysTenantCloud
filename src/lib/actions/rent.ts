"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rentPayments, tenants } from "@/lib/db/schema";
import type { RentPaymentStatus } from "@/lib/db/schema";
import { parseMXNToCents } from "@/lib/utils/format";
import {
  createRentPaymentSchema,
  updateRentPaymentSchema,
} from "@/lib/validations/rent-maintenance";

export type RentActionState = {
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

export async function createRentPayment(
  _prev: RentActionState,
  formData: FormData
): Promise<RentActionState> {
  await requireLandlord();

  const parsed = createRentPaymentSchema.safeParse({
    tenantId: formData.get("tenantId"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please fill in all required fields." };
  }

  const [tenant] = await db
    .select({ propertyId: tenants.propertyId })
    .from(tenants)
    .where(eq(tenants.id, parsed.data.tenantId))
    .limit(1);

  if (!tenant) return { error: "Tenant not found." };

  const dueDate = new Date(parsed.data.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return { error: "Invalid due date." };
  }

  await db.insert(rentPayments).values({
    tenantId: parsed.data.tenantId,
    propertyId: tenant.propertyId,
    amount: parseMXNToCents(parsed.data.amount),
    dueDate,
    notes: parsed.data.notes?.trim() || null,
    status: "pending",
  });

  revalidatePath("/landlord/rent");
  revalidatePath("/landlord");
  revalidatePath("/portal/payments");
  return { success: "Rent payment recorded." };
}

export async function updateRentPayment(
  paymentId: string,
  _prev: RentActionState,
  formData: FormData
): Promise<RentActionState> {
  await requireLandlord();

  const parsed = updateRentPaymentSchema.safeParse({
    status: formData.get("status"),
    paidDate: formData.get("paidDate") || undefined,
    paymentMethod: formData.get("paymentMethod") || undefined,
    reference: formData.get("reference") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) return { error: "Invalid payment data." };

  const status = parsed.data.status as RentPaymentStatus;
  const paidDate = parsed.data.paidDate
    ? new Date(parsed.data.paidDate)
    : status === "paid"
      ? new Date()
      : null;

  await db
    .update(rentPayments)
    .set({
      status,
      paidDate,
      paymentMethod: parsed.data.paymentMethod?.trim() || "SPEI",
      reference: parsed.data.reference?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(rentPayments.id, paymentId));

  revalidatePath("/landlord/rent");
  revalidatePath("/landlord");
  revalidatePath("/portal/payments");
  return { success: "Payment updated." };
}
