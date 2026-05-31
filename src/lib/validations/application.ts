import { z } from "zod";
import { APPLICATION_STAGES } from "@/lib/db/schema/enums";

export const prospectProfileSchema = z.object({
  income: z.string().min(1, "Monthly income is required"),
  employer: z.string().min(1, "Employer is required"),
  position: z.string().min(1, "Position is required"),
  yearsEmployed: z.string().min(1, "Years employed is required"),
  previousRentals: z.string().optional(),
  references: z.string().optional(),
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
