import { z } from "zod";
import { MOVE_CHECKLIST_TYPES } from "@/lib/db/schema/enums";

export const moveChecklistSchema = z.object({
  type: z.enum(MOVE_CHECKLIST_TYPES),
  depositHeld: z.string().optional(),
  depositReturned: z.string().optional(),
  deductionNotes: z.string().optional(),
  conditionNotes: z.string().min(1, "Condition notes are required"),
});

export const completeMoveChecklistSchema = z.object({
  depositReturned: z.string().optional(),
  deductionNotes: z.string().optional(),
});
