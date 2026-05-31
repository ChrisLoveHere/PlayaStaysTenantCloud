import Link from "next/link";
import { auth } from "@/auth";
import { PropertiesTable } from "@/components/properties/properties-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { landlordNav } from "@/lib/pages/placeholder";
import { getProperties } from "@/lib/actions/properties";
import { parseLocationFilter } from "@/lib/constants/locations";

type PageProps = {
  searchParams: Promise<{ city?: string }>;
};

export default async function PropertiesPage({ searchParams }: PageProps) {
  const session = await auth();
  const { city: cityParam } = await searchParams;
  const city = parseLocationFilter(cityParam);
  const properties = await getProperties(city === "all" ? undefined : city);

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Properties"
      navItems={landlordNav}
      userName={session?.user?.name}
    >
      <div className="mb-4 flex justify-end">
        <Button asChild>
          <Link href="/landlord/properties/new">+ Add property</Link>
        </Button>
      </div>
      <PropertiesTable items={properties} />
    </DashboardShell>
  );
}
