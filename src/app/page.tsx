import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  ClipboardList,
  FileSignature,
  Home,
  Palmtree,
  UserPlus,
} from "lucide-react";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { getDashboardPath } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "PlayaStays · Tenant Application Portal",
  description:
    "Apply for long-term rentals in Quintana Roo, schedule property viewings, and track your application through move-in.",
};

const STEPS = [
  {
    icon: UserPlus,
    title: "Create account",
    text: "Register with your name, email, and phone.",
  },
  {
    icon: ClipboardList,
    title: "Submit application",
    text: "Complete your rental profile and upload screening documents.",
  },
  {
    icon: Calendar,
    title: "Schedule viewings",
    text: "Request showings for properties you want to see.",
  },
  {
    icon: FileSignature,
    title: "Sign lease",
    text: "Review and sign your lease when approved.",
  },
  {
    icon: Home,
    title: "Move in",
    text: "Get move-in details and manage rent in your portal.",
  },
] as const;

const FOOTER_LINKS = [
  { label: "PlayaStays", href: "https://www.playastays.com" },
  { label: "Playa del Carmen", href: "https://www.playastays.com/Playa-del-Carmen" },
  { label: "Tulum", href: "https://www.playastays.com/Tulum" },
  { label: "Cozumel", href: "https://www.playastays.com/Cozumel" },
  { label: "Puerto Morelos", href: "https://www.playastays.com/Puerto-Morelos" },
] as const;

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(getDashboardPath(session.user.role));
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col app-shell-bg">
      <header className="shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient shadow-sm">
              <Palmtree className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              PlayaStays
            </span>
          </div>
          <Button size="sm" asChild>
            <Link href="/register">
              Create account
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Quintana Roo · Long-term rentals
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2rem] lg:leading-tight">
                Tenant Application Portal
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                Apply for available properties, schedule viewings, and follow your
                application from screening through move-in. Our team and leasing
                agents use this portal to review applications and coordinate
                showings on your behalf.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold">How it works</h2>
              <ol className="mt-3 hidden gap-2 sm:grid sm:grid-cols-5">
                {STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex flex-col items-center rounded-lg border border-border/60 bg-card/80 px-2 py-3 text-center shadow-sm"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <step.icon className="mt-2 h-4 w-4 text-primary" />
                    <span className="mt-1.5 text-xs font-medium leading-tight">
                      {step.title}
                    </span>
                  </li>
                ))}
              </ol>
              <ol className="mt-3 space-y-2 sm:hidden">
                {STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/80 px-3 py-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-xs text-muted-foreground">
              New here?{" "}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create an account
              </Link>{" "}
              to start your application. Landlords and agents can sign in with
              their staff credentials below.
            </p>
          </div>

          <div className="lg:pt-1">
            <Suspense
              fallback={
                <div className="h-[340px] animate-pulse rounded-xl border bg-muted/40" />
              }
            >
              <LoginForm
                title="Sign in"
                description="Access your application, viewings, and lease."
              />
            </Suspense>
          </div>
        </div>
      </main>

      <footer className="shrink-0 border-t border-border/60 py-3 text-center text-xs text-muted-foreground">
        <p className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          {FOOTER_LINKS.map((link, index) => (
            <span key={link.href} className="inline-flex items-center">
              {index > 0 && <span className="mx-1.5 text-border">·</span>}
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {link.label}
              </a>
            </span>
          ))}
        </p>
      </footer>
    </div>
  );
}
