import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { applicationStageLabel, formatMXN } from "@/lib/utils/format";
import { getLocationLabel } from "@/lib/constants/locations";

type MyApplication = {
  id: string;
  stage: string;
  propertyCode: string;
  location: string;
  ciudad: string;
  monthlyRent: number;
  submittedAt: Date | null;
};

export function MyApplicationsList({ items }: { items: MyApplication[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          You haven&apos;t applied to any properties yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My applications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((app) => (
          <div
            key={app.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
          >
            <div>
              <p className="font-mono text-sm font-medium">{app.propertyCode}</p>
              <p className="text-sm text-muted-foreground">
                {getLocationLabel(app.location)} · {formatMXN(app.monthlyRent)}/mo
              </p>
            </div>
            <Badge variant="secondary">{applicationStageLabel(app.stage)}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
