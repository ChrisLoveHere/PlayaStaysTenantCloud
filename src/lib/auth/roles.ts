import type { UserRole } from "@/lib/db/schema";

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "landlord":
      return "/landlord";
    case "agent":
      return "/agent";
    case "tenant":
      return "/portal";
    case "prospect":
      return "/portal";
    default:
      return "/portal";
  }
}
