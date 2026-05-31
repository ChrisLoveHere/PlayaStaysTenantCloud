import Link from "next/link";
import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold">PlayaStays</span>
          </div>
          <div className="flex gap-2">
            {session ? (
              <Button asChild>
                <Link href={getDashboardPath(session.user.role)}>
                  Go to dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Apply now</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Long-term rentals across Quintana Roo
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          PlayaStays manages properties in Playa del Carmen, Tulum, Cozumel,
          Puerto Morelos, Isla Mujeres, and Xpu-Ha — with location-aware
          dashboards, tenant portals, and agent tools.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {!session && (
            <>
              <Button size="lg" asChild>
                <Link href="/register">Start application</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Staff login</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/register/agent">Register as agent</Link>
              </Button>
            </>
          )}
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        PlayaStays — Quintana Roo · MXN · SPEI-friendly
      </footer>
    </div>
  );
}
