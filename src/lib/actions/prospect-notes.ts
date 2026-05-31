"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getAgentProfileByUserId } from "@/lib/auth/agent";
import { db } from "@/lib/db";
import { applications, prospectNotes } from "@/lib/db/schema";

export type ProspectNoteActionState = {
  error?: string;
  success?: string;
};

export async function addProspectNote(
  prospectId: string,
  applicationId: string | null,
  _prev: ProspectNoteActionState,
  formData: FormData
): Promise<ProspectNoteActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const role = session.user.role;
  if (role !== "landlord" && role !== "agent") {
    return { error: "Forbidden." };
  }

  if (role === "agent") {
    const profile = await getAgentProfileByUserId(session.user.id);
    if (!profile?.isActive) return { error: "Forbidden." };

    if (applicationId) {
      const [app] = await db
        .select({ assignedAgentId: applications.assignedAgentId })
        .from(applications)
        .where(eq(applications.id, applicationId))
        .limit(1);

      if (!app || app.assignedAgentId !== profile.id) {
        return { error: "Not assigned to this prospect." };
      }
    }
  }

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Note cannot be empty." };
  if (body.length > 2000) return { error: "Note is too long." };

  await db.insert(prospectNotes).values({
    prospectId,
    applicationId,
    authorId: session.user.id,
    body,
  });

  if (applicationId) {
    revalidatePath(`/landlord/prospects/${applicationId}`);
    revalidatePath(`/agent/prospects/${applicationId}`);
  }

  return { success: "Note added." };
}
