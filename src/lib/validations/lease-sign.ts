import { z } from "zod";

export const signLeaseSchema = z.object({
  signedName: z.string().trim().min(2, "Enter your full legal name"),
  signatureData: z
    .string()
    .min(100, "Please sign in the box above")
    .refine((v) => v.startsWith("data:image/"), "Invalid signature"),
  agreed: z.literal("true", { message: "You must agree to the lease terms" }),
});
