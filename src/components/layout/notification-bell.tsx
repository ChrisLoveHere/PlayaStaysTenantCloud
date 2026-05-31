"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
};

export function NotificationBell() {
  const pathname = usePathname();
  const enabled =
    pathname.startsWith("/landlord") || pathname.startsWith("/agent");

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = (await res.json()) as { items: NotificationItem[] };
        if (!cancelled) {
          setItems(data.items ?? []);
        }
      } catch {
        // ignore fetch errors
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled, pathname]);

  if (!enabled) return null;

  const count = items.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative shrink-0"
          aria-label={`Notifications${count ? `, ${count} items` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!loaded ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Loading…</p>
        ) : count === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          items.slice(0, 8).map((item) => (
            <DropdownMenuItem key={item.id} asChild>
              <Link href={item.href} className="flex cursor-pointer flex-col gap-0.5">
                <span className="font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.message}</span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
