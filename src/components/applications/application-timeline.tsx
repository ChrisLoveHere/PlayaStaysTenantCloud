import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { applicationStageLabel } from "@/lib/utils/format";

type TimelineEntry = {
  id: string;
  applicationId: string;
  propertyCode: string;
  fromStage: string | null;
  toStage: string;
  notes: string | null;
  createdAt: Date;
  changedByName: string | null;
};

export function ApplicationTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Stage updates will appear here after you apply to a property.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Application activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-4 border-l pl-6">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-medium">
                  {entry.propertyCode}
                </span>
                {entry.fromStage && (
                  <>
                    <Badge variant="outline">
                      {applicationStageLabel(entry.fromStage)}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                  </>
                )}
                <Badge>{applicationStageLabel(entry.toStage)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString("en-US")}
                {entry.changedByName && ` · ${entry.changedByName}`}
              </p>
              {entry.notes && (
                <p className="mt-1 text-sm text-muted-foreground">{entry.notes}</p>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
