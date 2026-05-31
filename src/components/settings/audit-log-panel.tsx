import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { applicationStageLabel } from "@/lib/utils/format";

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: Date;
  actorName: string | null;
};

export function AuditLogPanel({ entries }: { entries: AuditRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity log</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id} className="border-b pb-3 last:border-0">
                <p className="text-sm">{entry.summary}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(entry.createdAt).toLocaleString("en-US")}</span>
                  {entry.actorName && <span>· {entry.actorName}</span>}
                  <Badge variant="outline" className="text-[10px]">
                    {entry.action.replace(/\./g, " · ")}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
