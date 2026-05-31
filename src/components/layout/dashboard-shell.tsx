"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu, Palmtree } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DashboardNav, type NavItem } from "@/components/layout/dashboard-nav";

type DashboardShellProps = {
  title: string;
  subtitle?: string;
  description?: string;
  navItems: NavItem[];
  userName?: string | null;
  children: React.ReactNode;
};

function UserInitials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : name.slice(0, 2);
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-semibold uppercase text-sidebar-primary">
      {initials}
    </span>
  );
}

function SidebarContent({
  title,
  navItems,
  userName,
  onNavigate,
}: {
  title: string;
  navItems: NavItem[];
  userName?: string | null;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient shadow-sm">
          <Palmtree className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-none text-sidebar-foreground">
            PlayaStays
          </p>
          <p className="truncate text-xs text-sidebar-foreground/60">{title}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <DashboardNav items={navItems} onNavigate={onNavigate} variant="sidebar" />
      </div>

      <div className="border-t border-sidebar-border p-4">
        {userName && (
          <div className="mb-3 flex items-center gap-2.5 px-1">
            <UserInitials name={userName} />
            <p className="truncate text-sm text-sidebar-foreground/80">
              {userName}
            </p>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 border-sidebar-border bg-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );
}

export function DashboardShell({
  title,
  subtitle,
  description,
  navItems,
  userName,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = subtitle ?? title;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[260px] shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <SidebarContent title={title} navItems={navItems} userName={userName} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col app-shell-bg">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[280px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex h-full flex-col">
                <SidebarContent
                  title={title}
                  navItems={navItems}
                  userName={userName}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{pageTitle}</p>
            {description && (
              <p className="truncate text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-6 hidden md:block">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {pageTitle}
              </h1>
              {description && (
                <p className="mt-1 max-w-2xl text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
