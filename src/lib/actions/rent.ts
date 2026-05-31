"use server";

import { and, eq, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendRentReceiptEmail } from "@/lib/email/notifications";
import { db } from "@/lib/db";
import { properties, rentPayments, tenants, users } from "@/lib/db/schema";
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

function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
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

export async function generateMonthlyRentAction(
  _prev: RentActionState,
  _formData: FormData
): Promise<RentActionState> {
  return generateMonthlyRentForAll();
}

export async function generateMonthlyRentForAll(): Promise<RentActionState> {
  await requireLandlord();

  const { start, end } = monthBounds();
  const label = start.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const activeTenants = await db
    .select({
      tenantId: tenants.id,
      propertyId: tenants.propertyId,
      monthlyRent: properties.monthlyRent,
      propertyCode: properties.propertyCode,
    })
    .from(tenants)
    .innerJoin(properties, eq(tenants.propertyId, properties.id))
    .where(eq(tenants.status, "active"));

  let created = 0;
  let skipped = 0;

  for (const tenant of activeTenants) {
    const [existing] = await db
      .select({ id: rentPayments.id })
      .from(rentPayments)
      .where(
        and(
          eq(rentPayments.tenantId, tenant.tenantId),
          gte(rentPayments.dueDate, start),
          lte(rentPayments.dueDate, end)
        )
      )
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    const dueDate = new Date(start.getFullYear(), start.getMonth(), 1);
    await db.insert(rentPayments).values({
      tenantId: tenant.tenantId,
      propertyId: tenant.propertyId,
      amount: tenant.monthlyRent,
      dueDate,
      notes: `Rent for ${label}`,
      status: "pending",
    });
    created++;
  }

  revalidatePath("/landlord/rent");
  revalidatePath("/landlord");
  revalidatePath("/portal/payments");

  if (created === 0) {
    return {
      success: `No new charges created — ${skipped} tenant(s) already have a charge for ${label}.`,
    };
  }

  return {
    success: `Created ${created} rent charge(s) for ${label}${skipped ? ` (${skipped} skipped)` : ""}.`,
  };
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

  const [before] = await db
    .select({ status: rentPayments.status })
    .from(rentPayments)
    .where(eq(rentPayments.id, paymentId))
    .limit(1);

  if (!before) return { error: "Payment not found." };

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

  if (status === "paid" && before.status !== "paid") {
    const tenantUser = alias(users, "tenant_user");
    const [row] = await db
      .select({
        amount: rentPayments.amount,
        paidDate: rentPayments.paidDate,
        reference: rentPayments.reference,
        paymentMethod: rentPayments.paymentMethod,
        propertyCode: properties.propertyCode,
        tenantName: tenantUser.name,
        tenantEmail: tenantUser.email,
      })
      .from(rentPayments)
      .innerJoin(tenants, eq(rentPayments.tenantId, tenants.id))
      .innerJoin(tenantUser, eq(tenants.userId, tenantUser.id))
      .innerJoin(properties, eq(rentPayments.propertyId, properties.id))
      .where(eq(rentPayments.id, paymentId))
      .limit(1);

    if (row?.tenantEmail && row.paidDate) {
      try {
        await sendRentReceiptEmail({
          tenantEmail: row.tenantEmail,
          tenantName: row.tenantName ?? "Tenant",
          propertyCode: row.propertyCode,
          amount: row.amount,
          paidDate: row.paidDate,
          reference: row.reference,
          paymentMethod: row.paymentMethod,
          paymentId,
        });
      } catch (err) {
        console.error("[rent receipt email]", err);
      }
    }
  }

  revalidatePath("/landlord/rent");
  revalidatePath("/landlord");
  revalidatePath("/portal/payments");
  return { success: "Payment updated." };
}
