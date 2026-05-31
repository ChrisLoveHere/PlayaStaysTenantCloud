import { z } from "zod";
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  RENT_PAYMENT_STATUSES,
} from "@/lib/db/schema/enums";

export const createRentPaymentSchema = z.object({
  tenantId: z.string().min(1, "Select a tenant"),
  amount: z.string().min(1, "Amount required"),
  dueDate: z.string().min(1, "Due date required"),
  notes: z.string().optional(),
});

export const updateRentPaymentSchema = z.object({
  status: z.enum(RENT_PAYMENT_STATUSES),
  paidDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const maintenanceRequestSchema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().min(1, "Description required"),
  priority: z.enum(MAINTENANCE_PRIORITIES),
});

export const landlordMaintenanceSchema = z.object({
  propertyId: z.string().min(1, "Select a property"),
  tenantId: z.string().optional(),
  title: z.string().min(1, "Title required"),
  description: z.string().min(1, "Description required"),
  priority: z.enum(MAINTENANCE_PRIORITIES),
});

export const updateMaintenanceSchema = z.object({
  status: z.enum(MAINTENANCE_STATUSES),
});
