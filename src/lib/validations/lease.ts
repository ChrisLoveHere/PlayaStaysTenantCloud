import { z } from "zod";
import { LEASE_STATUSES } from "@/lib/db/schema/enums";

export const createLeaseSchema = z.object({
  applicationId: z.string().min(1, "Select an application"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  monthlyRent: z.string().optional(),
  securityDeposit: z.string().optional(),
});

export const updateLeaseStatusSchema = z.object({
  status: z.enum(LEASE_STATUSES),
  moveInDate: z.string().optional(),
});
