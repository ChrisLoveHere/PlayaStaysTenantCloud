import { auth } from "@/auth";
import { ScheduleShowingForm } from "@/components/showings/schedule-showing-form";
import { ShowingsCalendar } from "@/components/showings/showings-calendar";
import { ShowingsTable } from "@/components/showings/showings-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
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
      title="PlayaStays"
      subtitle="Showings"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="space-y-8">
        <ScheduleShowingForm
          properties={formOptions.properties}
          prospects={formOptions.prospects}
          agents={formOptions.agents}
        />

        <div>
          <h2 className="mb-3 text-lg font-semibold">Calendar</h2>
          <ShowingsCalendar events={events} />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">All showings</h2>
          <ShowingsTable items={showings} />
        </div>
      </div>
    </DashboardShell>
  );
}
