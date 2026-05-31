"use client";

import type { DocumentRow } from "@/lib/queries/documents";
import { DocumentsPanel } from "@/components/documents/documents-panel";

type ApplicationDocGroup = {
  applicationId: string;
  propertyCode: string;
  documents: DocumentRow[];
};

export function ApplicationDocumentsList({
  groups,
  canUpload,
  canDelete,
}: {
  groups: ApplicationDocGroup[];
  canUpload: boolean;
  canDelete: boolean;
}) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Apply to a property to attach screening documents.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <DocumentsPanel
          key={group.applicationId}
          entityType="application"
          entityId={group.applicationId}
          documents={group.documents}
          canUpload={canUpload}
          canDelete={canDelete}
          title={`Documents — ${group.propertyCode}`}
          description="Upload ID, income proof, references, or other screening files."
        />
      ))}
    </div>
  );
}
