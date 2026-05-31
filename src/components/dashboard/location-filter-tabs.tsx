"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LOCATION_LABELS,
  PLAYA_LOCATIONS,
  type LocationFilter,
} from "@/lib/constants/locations";

const filters: { value: LocationFilter; label: string }[] = [
  { value: "all", label: "All Locations" },
  ...PLAYA_LOCATIONS.filter((l) => l !== "other").map((value) => ({
    value: value as LocationFilter,
    label: LOCATION_LABELS[value],
  })),
];

export function LocationFilterTabs({ active }: { active: LocationFilter }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setCity(city: LocationFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (city === "all") {
      params.delete("city");
    } else {
      params.set("city", city);
    }
    const qs = params.toString();
    router.push(qs ? `/landlord?${qs}` : "/landlord");
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-1.5 shadow-sm ring-1 ring-border/60">
      {filters.map((f) => (
        <button
          key={f.value}
          type="button"
          onClick={() => setCity(f.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            active === f.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
