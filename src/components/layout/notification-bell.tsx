"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
  read?: boolean;
};

export function NotificationBell() {
  const pathname = usePathname();
  const enabled =
    pathname.startsWith("/landlord") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/portal");

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: NotificationItem[];
        unreadCount: number;
      };
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // ignore fetch errors
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [enabled, pathname, load]);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationKey: id }),
    });
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationKeys: unreadIds }),
    });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  if (!enabled) return null;

  const displayItems = items.filter((n) => !n.read).slice(0, 8);
  const showCount = unreadCount;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative shrink-0"
          aria-label={`Notifications${showCount ? `, ${showCount} unread` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {showCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {showCount > 9 ? "9+" : showCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {showCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {!loaded ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Loading…</p>
        ) : displayItems.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          displayItems.map((item) => (
            <DropdownMenuItem key={item.id} asChild>
              <Link
                href={item.href}
                className="flex cursor-pointer flex-col gap-0.5"
                onClick={() => markRead(item.id)}
              >
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
