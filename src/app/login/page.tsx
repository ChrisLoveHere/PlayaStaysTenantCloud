import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Palmtree } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen min-h-[100dvh] lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between brand-gradient p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Palmtree className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold">PlayaStays</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Tenant Application Portal
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Sign in to continue your application, manage showings, or access your
            lease and rent payments.
          </p>
        </div>
        <p className="text-sm text-white/60">
          Landlords and agents — use your staff credentials to sign in.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center app-shell-bg p-6">
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
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
