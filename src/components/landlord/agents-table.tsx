"use client";

import Link from "next/link";
import { useTransition } from "react";
import { approveAgent, deactivateAgent, rejectAgent } from "@/lib/actions/agents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AgentRow = {
  id: string;
  isActive: boolean;
  name: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
  commissionType: string;
  commissionRate: number;
  createdAt: Date;
};

export function AgentsTable({ agents }: { agents: AgentRow[] }) {
  const [pending, startTransition] = useTransition();

  function handleApprove(id: string) {
    startTransition(() => approveAgent(id));
  }

  function handleReject(id: string) {
    if (!confirm("Reject and delete this agent account?")) return;
    startTransition(() => rejectAgent(id));
  }

  function handleDeactivate(id: string) {
    if (!confirm("Deactivate this agent? They will lose portal access.")) return;
    startTransition(() => deactivateAgent(id));
  }

  const pendingAgents = agents.filter((a) => !a.isActive);
  const activeAgents = agents.filter((a) => a.isActive);

  return (
    <div className="space-y-8">
      {pendingAgents.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">
            Pending approval ({pendingAgents.length})
          </h2>
          <AgentTable
            agents={pendingAgents}
            pending={pending}
            onApprove={handleApprove}
            onReject={handleReject}
            showActions
          />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Active agents ({activeAgents.length})
        </h2>
        {activeAgents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active agents yet.</p>
        ) : (
          <AgentTable
            agents={activeAgents}
            pending={pending}
            onDeactivate={handleDeactivate}
            showManage
          />
        )}
      </div>
    </div>
  );
}

function AgentTable({
  agents,
  pending,
  onApprove,
  onReject,
  onDeactivate,
  showActions,
  showManage,
}: {
  agents: AgentRow[];
  pending: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  showActions?: boolean;
  showManage?: boolean;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell>
                <Link
                  href={`/landlord/agents/${agent.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {agent.name}
                </Link>
              </TableCell>
              <TableCell>{agent.email}</TableCell>
              <TableCell className="text-sm">
                {agent.commissionType === "percent"
                  ? `${agent.commissionRate}%`
                  : `$${(agent.commissionRate / 100).toFixed(0)} flat`}
              </TableCell>
              <TableCell>
                <Badge variant={agent.isActive ? "default" : "secondary"}>
                  {agent.isActive ? "Active" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2 text-right">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/landlord/agents/${agent.id}`}>Manage</Link>
                </Button>
                {showActions && onApprove && onReject && (
                  <>
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => onApprove(agent.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => onReject(agent.id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {showManage && onDeactivate && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => onDeactivate(agent.id)}
                  >
                    Deactivate
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
