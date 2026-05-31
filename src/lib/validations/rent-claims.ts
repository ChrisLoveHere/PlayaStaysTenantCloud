import { z } from "zod";

export const submitPaymentClaimSchema = z.object({
  rentPaymentId: z.string().min(1, "Select a payment"),
  reference: z.string().min(3, "SPEI reference required"),
  amount: z.string().min(1, "Amount required"),
  paidDate: z.string().min(1, "Payment date required"),
  tenantNotes: z.string().optional(),
});

export const matchReferenceSchema = z.object({
  reference: z.string().min(2, "Enter a reference to search"),
});

export const rejectClaimSchema = z.object({
  landlordNotes: z.string().optional(),
});
