import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Palmtree } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center app-shell-bg p-6">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient">
          <Palmtree className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold">PlayaStays</span>
      </Link>
      <ForgotPasswordForm />
    </div>
  );
}
