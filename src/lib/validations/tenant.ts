import { z } from "zod";
import { TENANT_STATUSES } from "@/lib/db/schema/enums";

export const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  propertyId: z.string().min(1, "Select a property"),
  assignedAgentId: z.string().optional(),
  moveInDate: z.string().optional(),
  status: z.enum(TENANT_STATUSES).default("active"),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  propertyId: z.string().min(1, "Select a property"),
  assignedAgentId: z.string().optional(),
  status: z.enum(TENANT_STATUSES),
  moveInDate: z.string().optional(),
  moveOutDate: z.string().optional(),
});
