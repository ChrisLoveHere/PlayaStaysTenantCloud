import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { prospectNotes, users } from "@/lib/db/schema";

export async function getProspectNotes(prospectId: string) {
  return db
    .select({
      id: prospectNotes.id,
      body: prospectNotes.body,
      applicationId: prospectNotes.applicationId,
      createdAt: prospectNotes.createdAt,
      authorName: users.name,
    })
    .from(prospectNotes)
    .innerJoin(users, eq(prospectNotes.authorId, users.id))
    .where(eq(prospectNotes.prospectId, prospectId))
    .orderBy(desc(prospectNotes.createdAt));
}
