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
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f.value}
          type="button"
          onClick={() => setCity(f.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            active === f.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
