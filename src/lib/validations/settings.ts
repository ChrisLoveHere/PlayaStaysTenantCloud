import { z } from "zod";

export const landlordSettingsSchema = z.object({
  speiClabe: z.string().optional(),
  speiBeneficiary: z.string().optional(),
  speiBank: z.string().optional(),
  notifyEmail: z.string().email().optional().or(z.literal("")),
  sendApplicationEmails: z.enum(["on", "off"]).optional(),
  sendReceiptEmails: z.enum(["on", "off"]).optional(),
});
