import { PlaceholderPage, landlordNav } from "@/lib/pages/placeholder";

export default function LeasesPage() {
  return (
    <PlaceholderPage
      title="Leases"
      portalTitle="Landlord"
      navItems={landlordNav}
      description="Upload lease PDFs, track dates, and send renewal alerts. Coming in Phase 5."
    />
  );
}
