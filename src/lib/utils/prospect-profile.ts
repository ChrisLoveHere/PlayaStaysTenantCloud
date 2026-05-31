/** Shared prospect profile completeness check for apply gates. */
export function isProspectProfileComplete(
  prospect: {
    firstName?: string | null;
    lastName?: string | null;
    currentAddress?: string | null;
    occupants?: number | null;
    income?: number | null;
    employment?: string | null;
    previousRentals?: string | null;
    references?: string | null;
  },
  user?: { phone?: string | null }
): boolean {
  return Boolean(
    prospect.firstName?.trim() &&
      prospect.lastName?.trim() &&
      user?.phone?.trim() &&
      prospect.currentAddress?.trim() &&
      prospect.occupants != null &&
      prospect.occupants >= 1 &&
      prospect.income &&
      prospect.employment &&
      prospect.previousRentals?.trim() &&
      prospect.references?.trim()
  );
}
