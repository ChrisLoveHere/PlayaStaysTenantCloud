"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { markRentPaymentPaid } from "@/lib/actions/rent";
import type { RentActionState } from "@/lib/actions/rent";
import { db } from "@/lib/db";
import { rentPaymentClaims, rentPayments } from "@/lib/db/schema";
import { getPendingClaimForPayment } from "@/lib/queries/rent-claims";
import { searchByReference } from "@/lib/queries/rent-claims";
import { getTenantByUserId } from "@/lib/queries/rent-maintenance";
import { parseMXNToCents } from "@/lib/utils/format";
import {
  matchReferenceSchema,
  rejectClaimSchema,
  submitPaymentClaimSchema,
} from "@/lib/validations/rent-claims";

export type RentClaimActionState = RentActionState;

async function requireLandlord() {
  const session = await auth();
  if (!session?.user || session.user.role !== "landlord") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function submitPaymentClaim(
  _prev: RentClaimActionState,
  formData: FormData
): Promise<RentClaimActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "tenant") {
    return { error: "Only tenants can report payments." };
  }

  const parsed = submitPaymentClaimSchema.safeParse({
    rentPaymentId: formData.get("rentPaymentId"),
    reference: formData.get("reference"),
    amount: formData.get("amount"),
    paidDate: formData.get("paidDate"),
    tenantNotes: formData.get("tenantNotes") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please fill in reference, amount, and payment date." };
  }

  const tenant = await getTenantByUserId(session.user.id);
  if (!tenant || tenant.status !== "active") {
    return { error: "No active tenancy found." };
  }

  const [payment] = await db
    .select({
      id: rentPayments.id,
      tenantId: rentPayments.tenantId,
      amount: rentPayments.amount,
      status: rentPayments.status,
    })
    .from(rentPayments)
    .where(eq(rentPayments.id, parsed.data.rentPaymentId))
    .limit(1);

  if (!payment || payment.tenantId !== tenant.id) {
    return { error: "Payment not found." };
  }

  if (!["pending", "overdue", "partial"].includes(payment.status)) {
    return { error: "This charge is not awaiting payment." };
  }

  const existing = await getPendingClaimForPayment(payment.id);
  if (existing) {
    return { error: "A payment report is already pending review for this charge." };
  }

  const paidDate = new Date(parsed.data.paidDate);
  if (Number.isNaN(paidDate.getTime())) {
    return { error: "Invalid payment date." };
  }

  await db.insert(rentPaymentClaims).values({
    rentPaymentId: payment.id,
    tenantId: tenant.id,
    reference: parsed.data.reference.trim(),
    amount: parseMXNToCents(parsed.data.amount),
    paidDate,
    tenantNotes: parsed.data.tenantNotes?.trim() || null,
    status: "pending_review",
  });

  revalidatePath("/portal/payments");
  revalidatePath("/landlord/rent");
  revalidatePath("/landlord");
  return {
    success: "Payment reported. Your landlord will confirm once they verify the transfer.",
  };
}

export async function approvePaymentClaim(
  claimId: string
): Promise<RentClaimActionState> {
  const session = await requireLandlord();

  const [claim] = await db
    .select()
    .from(rentPaymentClaims)
    .where(eq(rentPaymentClaims.id, claimId))
    .limit(1);

  if (!claim) return { error: "Claim not found." };
  if (claim.status !== "pending_review") {
    return { error: "This claim was already reviewed." };
  }

  const result = await markRentPaymentPaid(claim.rentPaymentId, {
    reference: claim.reference,
    paidDate: claim.paidDate,
    paymentMethod: "SPEI",
    notes: claim.tenantNotes,
  });

  if (result.error) return result;

  await db
    .update(rentPaymentClaims)
    .set({
      status: "approved",
      reviewedAt: new Date(),
      reviewedById: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(rentPaymentClaims.id, claimId));

  revalidatePath("/landlord/rent");
  revalidatePath("/landlord");
  revalidatePath("/portal/payments");
  return { success: "Payment approved and marked paid." };
}

export async function rejectPaymentClaim(
  claimId: string,
  _prev: RentClaimActionState,
  formData: FormData
): Promise<RentClaimActionState> {
  const session = await requireLandlord();

  const parsed = rejectClaimSchema.safeParse({
    landlordNotes: formData.get("landlordNotes") || undefined,
  });

  const [claim] = await db
    .select({ status: rentPaymentClaims.status })
    .from(rentPaymentClaims)
    .where(eq(rentPaymentClaims.id, claimId))
    .limit(1);

  if (!claim) return { error: "Claim not found." };
  if (claim.status !== "pending_review") {
    return { error: "This claim was already reviewed." };
  }

  await db
    .update(rentPaymentClaims)
    .set({
      status: "rejected",
      landlordNotes: parsed.success
        ? parsed.data.landlordNotes?.trim() || null
        : null,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(rentPaymentClaims.id, claimId));

  revalidatePath("/landlord/rent");
  revalidatePath("/landlord");
  revalidatePath("/portal/payments");
  return { success: "Payment report declined." };
}

export async function markPaymentPaidFromReference(
  paymentId: string,
  reference: string
): Promise<RentClaimActionState> {
  await requireLandlord();

  const [pendingClaim] = await db
    .select({ id: rentPaymentClaims.id })
    .from(rentPaymentClaims)
    .where(
      and(
        eq(rentPaymentClaims.rentPaymentId, paymentId),
        eq(rentPaymentClaims.status, "pending_review")
      )
    )
    .limit(1);

  if (pendingClaim) {
    return approvePaymentClaim(pendingClaim.id);
  }

  return markRentPaymentPaid(paymentId, {
    reference: reference.trim(),
    paidDate: new Date(),
    paymentMethod: "SPEI",
  });
}

export async function markPaidFromMatchAction(formData: FormData): Promise<void> {
  const paymentId = formData.get("paymentId");
  const reference = formData.get("reference");
  const claimId = formData.get("claimId");

  if (claimId && typeof claimId === "string") {
    await approvePaymentClaim(claimId);
    return;
  }

  if (paymentId && typeof paymentId === "string") {
    await markPaymentPaidFromReference(
      paymentId,
      typeof reference === "string" ? reference : ""
    );
  }
}

export async function searchRentByReference(
  _prev: RentClaimActionState,
  formData: FormData
): Promise<
  RentClaimActionState & {
    matches?: Awaited<ReturnType<typeof searchByReference>>;
    searchReference?: string;
  }
> {
  await requireLandlord();

  const parsed = matchReferenceSchema.safeParse({
    reference: formData.get("reference"),
  });

  if (!parsed.success) {
    return { error: "Enter a reference or property code to search." };
  }

  const matches = await searchByReference(parsed.data.reference);
  if (matches.length === 0) {
    return {
      error: "No unpaid charges or pending reports matched that reference.",
    };
  }

  return {
    success: `Found ${matches.length} match(es).`,
    matches,
    searchReference: parsed.data.reference.trim(),
  };
}
