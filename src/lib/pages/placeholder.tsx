import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NavItem } from "@/components/layout/dashboard-nav";

type PlaceholderPageProps = {
  title: string;
  portalTitle: string;
  navItems: NavItem[];
  description: string;
};

export async function PlaceholderPage({
  title,
  portalTitle,
  navItems,
  description,
}: PlaceholderPageProps) {
  const session = await auth();

  return (
    <DashboardShell
      title={portalTitle}
      subtitle={title}
      navItems={navItems}
      userName={session?.user?.name}
    >
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {description}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

export const landlordNav: NavItem[] = [
  { href: "/landlord", label: "Overview" },
  { href: "/landlord/properties", label: "Properties" },
  { href: "/landlord/prospects", label: "Prospects" },
  { href: "/landlord/showings", label: "Showings" },
  { href: "/landlord/tenants", label: "Tenants" },
  { href: "/landlord/agents", label: "Agents" },
  { href: "/landlord/leases", label: "Leases" },
  { href: "/landlord/rent", label: "Rent" },
  { href: "/landlord/maintenance", label: "Maintenance" },
  { href: "/landlord/commissions", label: "Commissions" },
];

export const agentNav: NavItem[] = [
  { href: "/agent", label: "Overview" },
  { href: "/agent/showings", label: "My Showings" },
  { href: "/agent/prospects", label: "My Prospects" },
  { href: "/agent/tenants", label: "My Tenants" },
  { href: "/agent/availability", label: "Availability" },
  { href: "/agent/commissions", label: "Commissions" },
];

export const prospectNav: NavItem[] = [
  { href: "/portal", label: "Home" },
  { href: "/portal/application", label: "My Application" },
  { href: "/portal/properties", label: "Properties" },
];

export const tenantNav: NavItem[] = [
  { href: "/portal", label: "Home" },
  { href: "/portal/lease", label: "Lease & Docs" },
  { href: "/portal/payments", label: "Rent Payments" },
  { href: "/portal/maintenance", label: "Maintenance" },
];
