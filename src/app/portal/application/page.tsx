import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ApplyToPropertyForm } from "@/components/applications/apply-to-property-form";
import { ApplicationDocumentsList } from "@/components/documents/application-documents-list";
import { ProspectShowingsList } from "@/components/showings/prospect-showings-list";
import { MyApplicationsList } from "@/components/applications/my-applications-list";
import { ProspectProfileForm } from "@/components/applications/prospect-profile-form";
import { ProspectScreeningDocuments } from "@/components/applications/prospect-screening-documents";
import { ApplicationTimeline } from "@/components/applications/application-timeline";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prospectNav } from "@/lib/pages/placeholder";
import {
  getApplicationsForProspect,
  getApplicationStageHistoryForProspect,
  getAvailableProperties,
  getProspectByUserId,
  getUserPhone,
} from "@/lib/queries/applications";
import { getDocumentsForEntity } from "@/lib/queries/documents";
import { getShowingsForProspect } from "@/lib/queries/showings";
import { isProspectProfileComplete } from "@/lib/utils/prospect-profile";
import { hasRequiredScreeningDocuments } from "@/lib/utils/screening-documents";

export default async function ApplicationPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "prospect") {
    redirect("/login");
  }

  const prospect = await getProspectByUserId(session.user.id);
  if (!prospect) redirect("/portal");

  const [myApplications, availableProperties, myShowings, userPhone, stageHistory, screeningDocs] =
    await Promise.all([
      getApplicationsForProspect(prospect.id),
      getAvailableProperties(),
      getShowingsForProspect(prospect.id),
      getUserPhone(session.user.id),
      getApplicationStageHistoryForProspect(prospect.id),
      getDocumentsForEntity("prospect", prospect.id),
    ]);

  const profileComplete = isProspectProfileComplete(prospect, {
    phone: userPhone,
  });
  const documentsComplete = hasRequiredScreeningDocuments(screeningDocs);

  const applicationDocGroups = await Promise.all(
    myApplications.map(async (app) => ({
      applicationId: app.id,
      propertyCode: app.propertyCode,
      documents: await getDocumentsForEntity("application", app.id),
    }))
  );

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="My Application"
      navItems={prospectNav}
      userName={session.user.name}
    >
      <div className="space-y-6">
        <ProspectProfileForm
          profile={{
            ...prospect,
            phone: userPhone,
          }}
        />
        <ProspectScreeningDocuments
          prospectId={prospect.id}
          documents={screeningDocs}
        />
        <ApplyToPropertyForm
          properties={availableProperties}
          profileComplete={profileComplete}
          documentsComplete={documentsComplete}
        />
        <ApplicationTimeline entries={stageHistory} />
        <div>
          <h2 className="mb-4 text-lg font-semibold">Screening documents</h2>
          <ApplicationDocumentsList
            groups={applicationDocGroups}
            canUpload
            canDelete
          />
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold">My showings</h2>
          <ProspectShowingsList items={myShowings} />
        </div>
        <MyApplicationsList items={myApplications} />
      </div>
    </DashboardShell>
  );
}
