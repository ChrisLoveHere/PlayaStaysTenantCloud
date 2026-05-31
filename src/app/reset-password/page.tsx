import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Palmtree } from "lucide-react";

type PageProps = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { email, token } = await searchParams;

  if (!email || !token) {
    redirect("/forgot-password");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center app-shell-bg p-6">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient">
          <Palmtree className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold">PlayaStays</span>
      </Link>
      <ResetPasswordForm email={email} token={token} />
    </div>
  );
}
