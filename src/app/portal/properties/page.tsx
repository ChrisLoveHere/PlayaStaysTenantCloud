import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PropertyListingCard } from "@/components/properties/property-listing-card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prospectNav } from "@/lib/pages/placeholder";
import { getAvailableProperties } from "@/lib/queries/applications";
import { getPhotosGroupedByProperty } from "@/lib/queries/properties";

export default async function PortalPropertiesPage() {
  const session = await auth();
  if (!session?.user || !["prospect", "tenant"].includes(session.user.role)) {
    redirect("/login");
  }

  const properties = await getAvailableProperties();
  const photosByProperty = await getPhotosGroupedByProperty(
    properties.map((p) => p.id)
  );

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle="Available Properties"
      navItems={prospectNav}
      userName={session.user.name}
    >
      {properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No available properties at this time.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => {
            const photos = photosByProperty.get(p.id) ?? [];
            return (
              <PropertyListingCard
                key={p.id}
                {...p}
                coverPhotoUrl={photos[0]?.url ?? null}
              />
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
