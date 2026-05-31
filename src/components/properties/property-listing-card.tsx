import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocationLabel } from "@/lib/constants/locations";
import { formatMXN } from "@/lib/utils/format";

type PropertyListingCardProps = {
  id: string;
  propertyCode: string;
  location: string;
  calle: string;
  colonia: string;
  ciudad: string;
  monthlyRent: number;
  description: string | null;
  coverPhotoUrl?: string | null;
};

export function PropertyListingCard({
  id,
  propertyCode,
  location,
  calle,
  colonia,
  ciudad,
  monthlyRent,
  description,
  coverPhotoUrl,
}: PropertyListingCardProps) {
  return (
    <Link href={`/portal/properties/${id}`} className="block h-full">
      <Card className="h-full overflow-hidden transition hover:ring-2 hover:ring-primary/30">
        <div className="relative aspect-[4/3] bg-muted">
          {coverPhotoUrl ? (
            <Image
              src={coverPhotoUrl}
              alt={propertyCode}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No photo
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-mono text-base">{propertyCode}</CardTitle>
            <Badge variant="secondary">{getLocationLabel(location)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            {calle}, {colonia}, {ciudad}
          </p>
          {description && (
            <p className="line-clamp-2 text-muted-foreground">{description}</p>
          )}
          <p className="font-semibold text-foreground">
            {formatMXN(monthlyRent)}/month
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
