"use client";

import { useActionState, useTransition } from "react";
import {
  deleteDocument,
  uploadDocument,
} from "@/lib/actions/documents";
import type { DocumentActionState } from "@/lib/actions/documents";
import type { DocumentEntityType } from "@/lib/db/schema";
import type { DocumentRow } from "@/lib/queries/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DocumentsPanel({
  entityType,
  entityId,
  documents: items,
  canUpload = false,
  canDelete = false,
  title = "Documents",
  description,
}: {
  entityType: DocumentEntityType;
  entityId: string;
  documents: DocumentRow[];
  canUpload?: boolean;
  canDelete?: boolean;
  title?: string;
  description?: string;
}) {
  const uploadAction = uploadDocument.bind(null, entityType, entityId);
  const [uploadState, uploadFormAction, uploadPending] = useActionState(
    uploadAction as (
      prev: DocumentActionState,
      fd: FormData
    ) => Promise<DocumentActionState>,
    {} as DocumentActionState
  );
  const [deletePending, startDelete] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents yet.</p>
        ) : (
          <ul className="divide-y text-sm">
            {items.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {doc.name}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString("en-US")}
                    {doc.uploadedByName && ` · ${doc.uploadedByName}`}
                  </p>
                </div>
                {canDelete && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={deletePending}
                    onClick={() =>
                      startDelete(async () => {
                        const fd = new FormData();
                        await deleteDocument(doc.id, {}, fd);
                      })
                    }
                  >
                    Delete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canUpload && (
          <form action={uploadFormAction} className="space-y-3 border-t pt-4">
            {uploadState.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {uploadState.error}
              </p>
            )}
            {uploadState.success && (
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                {uploadState.success}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor={`doc-name-${entityId}`}>Display name (optional)</Label>
              <Input
                id={`doc-name-${entityId}`}
                name="name"
                placeholder="Lease agreement, ID copy, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`doc-file-${entityId}`}>File</Label>
              <Input
                id={`doc-file-${entityId}`}
                name="file"
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={uploadPending}>
              {uploadPending ? "Uploading…" : "Upload document"}
            </Button>
          </form>
        )}
      </CardContent>
      {!canUpload && items.length > 0 && <CardFooter />}
    </Card>
  );
}
