"use client";

import { signOut } from "next-auth/react";
import { Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardNav, type NavItem } from "@/components/layout/dashboard-nav";

type DashboardShellProps = {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  userName?: string | null;
  children: React.ReactNode;
};

export function DashboardShell({
  title,
  subtitle,
  navItems,
  userName,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex items-center gap-2 border-b px-6 py-5">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <p className="font-semibold leading-none">Landlord Hub</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <DashboardNav items={navItems} />
        </div>
        <div className="border-t p-4">
          {userName && (
            <p className="mb-2 truncate text-sm text-muted-foreground">
              {userName}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b bg-background px-6 py-4 md:hidden">
          <p className="font-semibold">{title}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </header>
        <main className="flex-1 p-6">
          <div className="mb-6 hidden md:block">
            <h1 className="text-2xl font-semibold tracking-tight">{subtitle ?? title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
