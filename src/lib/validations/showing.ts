import { z } from "zod";
import { SHOWING_STATUSES } from "@/lib/db/schema/enums";

export const requestShowingSchema = z.object({
  propertyId: z.string().min(1, "Property required"),
  agentId: z.string().min(1, "Select an agent"),
  scheduledAt: z.string().min(1, "Date and time required"),
  durationMinutes: z.string().default("30"),
  notes: z.string().optional(),
});

export const scheduleShowingSchema = z.object({
  propertyId: z.string().min(1, "Select a property"),
  prospectId: z.string().min(1, "Select a prospect"),
  agentId: z.string().min(1, "Select an agent"),
  scheduledAt: z.string().min(1, "Date and time required"),
  durationMinutes: z.string().default("30"),
  notes: z.string().optional(),
});

export const showingOutcomeSchema = z.object({
  status: z.enum(SHOWING_STATUSES),
  outcomeNotes: z.string().optional(),
});

export const availabilityBlockSchema = z.object({
  startAt: z.string().min(1, "Start time required"),
  endAt: z.string().min(1, "End time required"),
  reason: z.string().optional(),
  allDay: z.string().optional(),
});
