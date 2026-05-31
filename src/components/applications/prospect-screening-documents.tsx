"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import type { DocumentRow } from "@/lib/queries/documents";
import { getScreeningDocumentStatus } from "@/lib/utils/screening-documents";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProspectScreeningDocuments({
  prospectId,
  documents,
}: {
  prospectId: string;
  documents: DocumentRow[];
}) {
  const status = getScreeningDocumentStatus(documents);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Screening documents</CardTitle>
        <CardDescription>
          Upload these before applying to a property. Include the document type
          in the file name (e.g. &quot;INE front&quot;, &quot;Pay stub March&quot;).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {status.items.map((item) => (
            <li key={item.key} className="flex items-start gap-2 text-sm">
              {item.satisfied ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span>
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground"> — {item.hint}</span>
              </span>
            </li>
          ))}
        </ul>
        {!status.complete && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Both documents are required before you can submit an application.
          </p>
        )}
        <DocumentsPanel
          entityType="prospect"
          entityId={prospectId}
          documents={documents}
          canUpload
          canDelete
          title="Your uploads"
          description="PDF or image files. Name each file so we can identify the document type."
        />
      </CardContent>
    </Card>
  );
}
