import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ApplyToPropertyForm } from "@/components/applications/apply-to-property-form";
import { MyApplicationsList } from "@/components/applications/my-applications-list";
import { ProspectProfileForm } from "@/components/applications/prospect-profile-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prospectNav } from "@/lib/pages/placeholder";
import {
  getApplicationsForProspect,
  getAvailableProperties,
  getProspectByUserId,
} from "@/lib/queries/applications";

export default async function ApplicationPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "prospect") {
    redirect("/login");
  }

  const prospect = await getProspectByUserId(session.user.id);
  if (!prospect) redirect("/portal");

  const [myApplications, availableProperties] = await Promise.all([
    getApplicationsForProspect(prospect.id),
    getAvailableProperties(),
  ]);

  const profileComplete = !!prospect.income && !!prospect.employment;

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="My Application"
      navItems={prospectNav}
      userName={session.user.name}
    >
      <div className="space-y-6">
        <ProspectProfileForm profile={prospect} />
        <ApplyToPropertyForm
          properties={availableProperties}
          profileComplete={profileComplete}
        />
        <MyApplicationsList items={myApplications} />
      </div>
    </DashboardShell>
  );
}
