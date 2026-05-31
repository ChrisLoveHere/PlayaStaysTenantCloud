import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { PropertyForm } from "@/components/properties/property-form";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { landlordNav } from "@/lib/pages/placeholder";
import { deleteProperty, getPropertyById } from "@/lib/actions/properties";
import { getDocumentsForEntity } from "@/lib/queries/documents";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPropertyPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) notFound();

  const propertyDocuments = await getDocumentsForEntity("property", id);

  const deleteWithId = async () => {
    "use server";
    await deleteProperty(id);
  };

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle={`Edit ${property.propertyCode}`}
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <PropertyForm property={property} />
      <div className="mt-6">
        <DocumentsPanel
          entityType="property"
          entityId={id}
          documents={propertyDocuments}
          canUpload
          canDelete
          title="Property documents"
          description="Deeds, insurance, floor plans, or other property files."
        />
      </div>
      <form action={deleteWithId} className="mt-4">
        <Button type="submit" variant="destructive" size="sm">
          Delete property
        </Button>
      </form>
    </DashboardShell>
  );
}
