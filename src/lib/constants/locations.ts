/** PlayaStays portfolio locations in Quintana Roo, Mexico */

export const PLAYA_LOCATIONS = [
  "playa_del_carmen",
  "puerto_morelos",
  "tulum",
  "cozumel",
  "isla_mujeres",
  "xpu_ha",
  "other",
] as const;

export type PlayaLocation = (typeof PLAYA_LOCATIONS)[number];

export const LOCATION_LABELS: Record<PlayaLocation, string> = {
  playa_del_carmen: "Playa del Carmen",
  puerto_morelos: "Puerto Morelos",
  tulum: "Tulum",
  cozumel: "Cozumel",
  isla_mujeres: "Isla Mujeres",
  xpu_ha: "Xpu-Ha",
  other: "Other",
};

/** Filter value for portfolio views — "all" or a specific location slug */
export type LocationFilter = "all" | PlayaLocation;

export function getLocationLabel(location: string): string {
  return LOCATION_LABELS[location as PlayaLocation] ?? location;
}

export function isValidLocation(value: string): value is PlayaLocation {
  return PLAYA_LOCATIONS.includes(value as PlayaLocation);
}

export function parseLocationFilter(value: string | undefined): LocationFilter {
  if (!value || value === "all") return "all";
  if (isValidLocation(value)) return value;
  return "all";
}
