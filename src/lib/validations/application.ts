import { z } from "zod";
import type { ApplicationStage } from "@/lib/db/schema";
import { APPLICATION_STAGES } from "@/lib/db/schema/enums";

/** Stages agents may set on assigned applications. */
export const AGENT_APPLICATION_STAGES = [
  "property_viewed",
  "screening",
] as const satisfies readonly ApplicationStage[];

export const prospectProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(7, "Phone number is required"),
  currentAddress: z.string().min(5, "Current address is required"),
  occupants: z.string().min(1, "Number of occupants is required"),
  pets: z.string().optional(),
  income: z.string().min(1, "Monthly income is required"),
  employer: z.string().min(1, "Employer is required"),
  position: z.string().min(1, "Position is required"),
  yearsEmployed: z.string().min(1, "Years employed is required"),
  previousRentals: z
    .string()
    .min(10, "Please list at least one previous address or rental"),
  references: z
    .string()
    .min(10, "Please provide at least one reference with contact info"),
});

export const applyToPropertySchema = z.object({
  propertyId: z.string().min(1, "Select a property"),
});

export const applicationReviewSchema = z.object({
  stage: z.enum(APPLICATION_STAGES),
  rating: z.string().optional(),
  landlordNotes: z.string().optional(),
  assignedAgentId: z.string().optional(),
});

export type ProspectProfileValues = z.infer<typeof prospectProfileSchema>;
