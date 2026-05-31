"use client";

import { removeAvailabilityBlock } from "@/lib/actions/availability";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

type Block = {
  id: string;
  startAt: Date;
  endAt: Date;
  reason: string | null;
};

export function AvailabilityBlocksList({ blocks }: { blocks: Block[] }) {
  const [pending, startTransition] = useTransition();

  if (blocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No blocked times yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {blocks.map((b) => (
        <li
          key={b.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
        >
          <div>
            <p className="font-medium">
              {new Date(b.startAt).toLocaleString("en-US")} →{" "}
              {new Date(b.endAt).toLocaleString("en-US")}
            </p>
            {b.reason && (
              <p className="text-muted-foreground">{b.reason}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(() => removeAvailabilityBlock(b.id))
            }
          >
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}
