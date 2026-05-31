import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAgentApproved } from "@/lib/auth/agent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PendingApprovalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "agent") {
    redirect("/");
  }

  const approved = await isAgentApproved(session.user.id);
  if (approved) {
    redirect("/agent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Account pending approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Thanks for registering as a leasing agent. Your account is waiting
            for admin approval before you can access the agent dashboard.
          </p>
          <p>You will be able to sign in and view your dashboard once approved.</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
