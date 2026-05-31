import Link from "next/link";
import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Palmtree, MapPin, Shield, Users } from "lucide-react";

const LOCATIONS = [
  "Playa del Carmen",
  "Tulum",
  "Cozumel",
  "Puerto Morelos",
  "Isla Mujeres",
  "Xpu-Ha",
];

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col app-shell-bg">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient shadow-sm">
              <Palmtree className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              PlayaStays
            </span>
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

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <MapPin className="h-3.5 w-3.5" />
              Quintana Roo, Mexico
            </p>
            <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Property management built for the Riviera Maya
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              One hub for landlords, leasing agents, and tenants — portfolios,
              showings, leases, rent in MXN, and maintenance across the coast.
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
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-accent/40 blur-2xl" />
            <div className="relative rounded-2xl border bg-card p-6 shadow-lg ring-1 ring-border/60">
              <p className="text-sm font-medium text-muted-foreground">
                Portfolio locations
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {LOCATIONS.map((city) => (
                  <span
                    key={city}
                    className="rounded-full border bg-background px-3 py-1.5 text-sm font-medium shadow-sm"
                  >
                    {city}
                  </span>
                ))}
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Feature
                  icon={Shield}
                  title="Landlord hub"
                  text="Properties, prospects, leases, and rent in one dashboard."
                />
                <Feature
                  icon={Users}
                  title="Agent tools"
                  text="Showings, availability, and commissions for your team."
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        PlayaStays · Quintana Roo · MXN · SPEI-friendly payments
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Shield;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-4">
      <div className="mb-2 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
