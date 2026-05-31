import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLocationLabel } from "@/lib/constants/locations";
import { showingStatusLabel } from "@/lib/utils/format";

type ShowingRow = {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: string;
  propertyCode: string;
  location: string;
  prospectName: string | null;
  agentName?: string | null;
};

export function ShowingsTable({ items }: { items: ShowingRow[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No showings scheduled yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Prospect</TableHead>
            {items[0]?.agentName !== undefined && <TableHead>Agent</TableHead>}
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
                <span className="block text-xs text-muted-foreground">
                  {s.durationMinutes} min
                </span>
              </TableCell>
              <TableCell className="font-mono text-sm">{s.propertyCode}</TableCell>
              <TableCell>{getLocationLabel(s.location)}</TableCell>
              <TableCell>{s.prospectName ?? "—"}</TableCell>
              {s.agentName !== undefined && (
                <TableCell>{s.agentName ?? "—"}</TableCell>
              )}
              <TableCell>
                <Badge variant={s.status === "scheduled" ? "default" : "secondary"}>
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
