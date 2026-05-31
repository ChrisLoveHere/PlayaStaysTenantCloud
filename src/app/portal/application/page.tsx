import { PlaceholderPage, prospectNav } from "@/lib/pages/placeholder";

export default function ApplicationPage() {
  return (
    <PlaceholderPage
      title="My Application"
      portalTitle="Prospect Portal"
      navItems={prospectNav}
      description="Complete your rental application — income, employment, references, and documents. Coming in Phase 3."
    />
  );
}
