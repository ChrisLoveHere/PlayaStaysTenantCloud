import { z } from "zod";
import { DOCUMENT_ENTITY_TYPES } from "@/lib/db/schema/enums";

export const uploadDocumentSchema = z.object({
  entityType: z.enum(DOCUMENT_ENTITY_TYPES),
  entityId: z.string().min(1),
  name: z.string().optional(),
});
