"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StatusOption = { value: string; label: string };

type ListFilterBarProps = {
  searchPlaceholder?: string;
  statusOptions?: StatusOption[];
};

export function ListFilterBar({
  searchPlaceholder = "Search…",
  statusOptions,
}: ListFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQ = searchParams.get("q") ?? "";
  const currentStatus = searchParams.get("status") ?? "";

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("q") ?? "").trim();
    const status = String(fd.get("status") ?? "");
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function clearFilters() {
    router.push(pathname);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-4 flex flex-wrap items-end gap-2"
    >
      <div className="min-w-[200px] flex-1">
        <Input
          name="q"
          defaultValue={currentQ}
          placeholder={searchPlaceholder}
          aria-label="Search"
        />
      </div>
      {statusOptions && statusOptions.length > 0 && (
        <select
          name="status"
          defaultValue={currentStatus}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          aria-label="Status filter"
        >
          <option value="">All statuses</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      <Button type="submit" size="sm" variant="secondary">
        Filter
      </Button>
      {(currentQ || currentStatus) && (
        <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
          Clear
        </Button>
      )}
    </form>
  );
}
