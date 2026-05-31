import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavIcon } from "@/lib/navigation/nav-icons";

export type NavItem = {
  href: string;
  label: string;
};

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/landlord" || href === "/agent" || href === "/portal") {
    return false;
  }
  return pathname.startsWith(`${href}/`);
}

export function DashboardNav({
  items,
  variant = "default",
  onNavigate,
}: {
  items: NavItem[];
  variant?: "default" | "sidebar";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isSidebar = variant === "sidebar";

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isNavActive(pathname, item.href);

        const Icon = getNavIcon(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              isSidebar
                ? active
                  ? "bg-sidebar-accent text-sidebar-foreground shadow-sm ring-1 ring-sidebar-primary/30"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                : active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isSidebar
                  ? active
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                  : active
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
              )}
            />
            <span>{item.label}</span>
            {isSidebar && active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
