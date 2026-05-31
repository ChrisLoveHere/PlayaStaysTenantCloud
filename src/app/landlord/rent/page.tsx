import { PlaceholderPage, landlordNav } from "@/lib/pages/placeholder";

export default function RentPage() {
  return (
    <PlaceholderPage
      title="Rent Payments"
      portalTitle="Landlord"
      navItems={landlordNav}
      description="Track rent in MXN with SPEI reference numbers and payment status. Coming in Phase 6."
    />
  );
}
