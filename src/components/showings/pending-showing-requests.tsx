import { confirmShowingRequest, declineShowingRequest } from "@/lib/actions/showings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLocationLabel } from "@/lib/constants/locations";

type PendingRequest = {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  outcomeNotes: string | null;
  propertyCode: string;
  location: string;
  prospectName: string | null;
  agentName: string | null;
};

export function PendingShowingRequests({ items }: { items: PendingRequest[] }) {
  if (items.length === 0) return null;

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Pending showing requests</CardTitle>
        <CardDescription>
          Prospects requested these times — confirm or decline to notify the agent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="text-sm">
              <p className="font-medium">
                {item.prospectName} ·{" "}
                <span className="font-mono">{item.propertyCode}</span>
              </p>
              <p className="text-muted-foreground">
                {getLocationLabel(item.location)} · Agent: {item.agentName}
              </p>
              <p className="mt-1">
                {new Date(item.scheduledAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                ({item.durationMinutes} min)
              </p>
              {item.outcomeNotes && (
                <p className="mt-1 text-muted-foreground">{item.outcomeNotes}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <form
                action={async () => {
                  "use server";
                  await confirmShowingRequest(item.id);
                }}
              >
                <Button type="submit" size="sm">
                  Confirm
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await declineShowingRequest(item.id);
                }}
              >
                <Button type="submit" size="sm" variant="outline">
                  Decline
                </Button>
              </form>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
