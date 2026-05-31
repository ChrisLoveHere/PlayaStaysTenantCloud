import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showingStatusLabel } from "@/lib/utils/format";

type ProspectShowingRow = {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: string;
  outcomeNotes: string | null;
  propertyCode: string;
  location: string;
  agentName: string | null;
};

export function ProspectShowingsList({ items }: { items: ProspectShowingRow[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No showing requests yet. Browse properties to schedule a visit.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="whitespace-nowrap text-sm">
                {new Date(s.scheduledAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </TableCell>
              <TableCell className="font-mono text-sm">{s.propertyCode}</TableCell>
              <TableCell>{s.agentName ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={s.status === "requested" ? "secondary" : "default"}>
                  {showingStatusLabel(s.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
