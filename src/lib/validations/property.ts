import { z } from "zod";
import { PLAYA_LOCATIONS, PROPERTY_STATUSES } from "@/lib/db/schema/enums";

export const propertyFormSchema = z.object({
  propertyCode: z.string().min(1, "Property ID is required"),
  location: z.enum(PLAYA_LOCATIONS),
  calle: z.string().min(1, "Street address is required"),
  colonia: z.string().min(1, "Colonia is required"),
  ciudad: z.string().min(1, "City is required"),
  estado: z.string().min(1, "State is required"),
  cp: z.string().min(4, "Postal code is required"),
  pais: z.string().default("México"),
  status: z.enum(PROPERTY_STATUSES),
  monthlyRent: z.string().min(1, "Monthly rent is required"),
  securityDeposit: z.string().min(1, "Security deposit is required"),
  description: z.string().optional(),
  keycodes: z.string().optional(),
  amenities: z.string().optional(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;
