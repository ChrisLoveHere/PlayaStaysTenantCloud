"use client";

import { approveAgent, rejectAgent } from "@/lib/actions/agents";
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
import { useTransition } from "react";

type AgentRow = {
  id: string;
  isActive: boolean;
  name: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
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
          <AgentTable agents={activeAgents} pending={pending} />
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
  showActions,
}: {
  agents: AgentRow[];
  pending: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  showActions?: boolean;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell className="font-medium">{agent.name}</TableCell>
              <TableCell>{agent.email}</TableCell>
              <TableCell>{agent.phone ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={agent.isActive ? "default" : "secondary"}>
                  {agent.isActive ? "Active" : "Pending"}
                </Badge>
              </TableCell>
              {showActions && onApprove && onReject && (
                <TableCell className="space-x-2 text-right">
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
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
