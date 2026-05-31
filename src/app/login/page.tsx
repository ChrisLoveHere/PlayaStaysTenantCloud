import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Palmtree } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between brand-gradient p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Palmtree className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold">PlayaStays</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Your portal for long-term rentals across Quintana Roo
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Landlords, agents, and tenants sign in here to manage properties,
            applications, showings, and rent.
          </p>
        </div>
        <p className="text-sm text-white/60">
          Playa del Carmen · Tulum · Cozumel · Puerto Morelos · Isla Mujeres
        </p>
      </div>

      <div className="flex flex-col items-center justify-center app-shell-bg p-6">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 lg:hidden"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient">
            <Palmtree className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold">PlayaStays</span>
        </Link>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
