import { z } from "zod";
import { COMMISSION_TYPES } from "@/lib/db/schema/enums";

export const createAgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  commissionType: z.enum(COMMISSION_TYPES).default("percent"),
  commissionRate: z.string().min(1, "Commission rate is required"),
  bio: z.string().optional(),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  commissionType: z.enum(COMMISSION_TYPES),
  commissionRate: z.string().min(1, "Commission rate is required"),
  bio: z.string().optional(),
  isActive: z.enum(["true", "false"]),
});
