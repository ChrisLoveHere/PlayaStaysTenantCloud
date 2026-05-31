import { auth } from "@/auth";
import { ScheduleShowingForm } from "@/components/showings/schedule-showing-form";
import { ShowingsCalendar } from "@/components/showings/showings-calendar";
import { ShowingsTable } from "@/components/showings/showings-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SectionHeader } from "@/components/layout/page-header";
import { landlordNav } from "@/lib/pages/placeholder";
import {
  getAllShowingsCalendarEvents,
  getScheduleFormOptions,
  getShowingsForLandlord,
} from "@/lib/queries/showings";

export default async function LandlordShowingsPage() {
  const session = await auth();
  const [showings, events, formOptions] = await Promise.all([
    getShowingsForLandlord(),
    getAllShowingsCalendarEvents(),
    getScheduleFormOptions(),
  ]);

  return (
    <DashboardShell
      title="Landlord"
      subtitle="Showings"
      description="Schedule property tours and track outcomes on the calendar."
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="space-y-8">
        <ScheduleShowingForm
          properties={formOptions.properties}
          prospects={formOptions.prospects}
          agents={formOptions.agents}
        />

        <ShowingsCalendar events={events} />

        <div>
          <SectionHeader
            title="All showings"
            description="Complete list with status and agent assignments."
          />
          <ShowingsTable items={showings} />
        </div>
      </div>
    </DashboardShell>
  );
}
