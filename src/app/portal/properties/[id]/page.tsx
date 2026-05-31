import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ApplyToPropertyForm } from "@/components/applications/apply-to-property-form";
import { RequestShowingForm } from "@/components/showings/request-showing-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prospectNav } from "@/lib/pages/placeholder";
import {
  getApplicationsForProspect,
  getAvailableProperties,
  getProspectByUserId,
  getUserPhone,
} from "@/lib/queries/applications";
import { getAvailablePropertyById } from "@/lib/queries/properties";
import { getActiveAgents } from "@/lib/queries/showings";
import { isProspectProfileComplete } from "@/lib/utils/prospect-profile";
import { getLocationLabel } from "@/lib/constants/locations";
import { formatMXN } from "@/lib/utils/format";

type PageProps = {
  params: Promise<{ id: string }>;
};

function parseAmenities(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || !["prospect", "tenant"].includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;
  const property = await getAvailablePropertyById(id);
  if (!property) notFound();

  const amenities = parseAmenities(property.amenities);
  const isProspect = session.user.role === "prospect";

  let profileComplete = false;
  let hasApplication = false;
  let agents: { id: string; name: string | null }[] = [];

  if (isProspect) {
    const prospect = await getProspectByUserId(session.user.id);
    if (prospect) {
      const userPhone = await getUserPhone(session.user.id);
      profileComplete = isProspectProfileComplete(prospect, {
        phone: userPhone,
      });
      const applications = await getApplicationsForProspect(prospect.id);
      hasApplication = applications.some((a) => a.propertyId === property.id);
    }
    agents = await getActiveAgents();
  }

  const availableProperties = isProspect
    ? await getAvailableProperties()
    : [];

  return (
    <DashboardShell
      title="PlayaStays"
      subtitle={property.propertyCode}
      navItems={prospectNav}
      userName={session.user.name}
    >
      <Link
        href="/portal/properties"
        className="mb-4 inline-block text-sm text-primary hover:underline"
      >
        ← Back to properties
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {property.photos.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {property.photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`relative overflow-hidden rounded-xl border ${
                    index === 0 ? "sm:col-span-2 aspect-[16/9]" : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? property.propertyCode}
                    fill
                    className="object-cover"
                    unoptimized
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-xl border bg-muted text-muted-foreground">
              Photos coming soon
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="font-mono">{property.propertyCode}</CardTitle>
                <Badge>{getLocationLabel(property.location)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                {property.calle}, {property.colonia}, {property.ciudad},{" "}
                {property.estado} {property.cp}
              </p>
              {property.description && <p>{property.description}</p>}
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Monthly rent</dt>
                  <dd className="text-lg font-semibold">
                    {formatMXN(property.monthlyRent)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Security deposit</dt>
                  <dd className="font-medium">
                    {formatMXN(property.securityDeposit)}
                  </dd>
                </div>
              </dl>
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {amenities.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isProspect && (
          <div className="space-y-6">
            {!hasApplication ? (
              <ApplyToPropertyForm
                properties={availableProperties}
                profileComplete={profileComplete}
                defaultPropertyId={property.id}
                compact
              />
            ) : (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                  You already applied for this property.{" "}
                  <Link href="/portal/application" className="text-primary hover:underline">
                    View application status
                  </Link>
                </CardContent>
              </Card>
            )}
            <RequestShowingForm propertyId={property.id} agents={agents} />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
