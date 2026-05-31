import { auth } from "@/auth";
import { PropertyForm } from "@/components/properties/property-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { landlordNav } from "@/lib/pages/placeholder";

export default async function NewPropertyPage() {
  const session = await auth();

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Add Property"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <PropertyForm />
    </DashboardShell>
  );
}
