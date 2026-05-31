import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAgentApproved } from "@/lib/auth/agent";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "agent") {
    redirect("/login");
  }

  const approved = await isAgentApproved(session.user.id);
  if (!approved) {
    redirect("/pending-approval");
  }

  return <>{children}</>;
}
