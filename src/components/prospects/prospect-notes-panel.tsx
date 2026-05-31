"use client";

import { useActionState } from "react";
import { addProspectNote } from "@/lib/actions/prospect-notes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Note = {
  id: string;
  body: string;
  applicationId: string | null;
  createdAt: Date;
  authorName: string | null;
};

type ProspectNotesPanelProps = {
  prospectId: string;
  applicationId: string;
  notes: Note[];
  canAdd?: boolean;
};

export function ProspectNotesPanel({
  prospectId,
  applicationId,
  notes,
  canAdd = true,
}: ProspectNotesPanelProps) {
  const action = addProspectNote.bind(null, prospectId, applicationId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Prospect notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border bg-muted/30 p-3">
                <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {note.authorName ?? "Staff"} ·{" "}
                  {new Date(note.createdAt).toLocaleString("en-US")}
                </p>
              </div>
            ))}
          </div>
        )}

        {canAdd && (
          <form action={formAction} className="space-y-2">
            <Textarea
              name="body"
              placeholder="Add a note about this prospect…"
              rows={3}
              disabled={pending}
            />
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            {state.success && (
              <p className="text-sm text-green-600">{state.success}</p>
            )}
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Add note"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
