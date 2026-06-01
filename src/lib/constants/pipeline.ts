import type { ApplicationStage } from "@/lib/db/schema";

export const PIPELINE_COLUMN_IDS = [
  "new_deal",
  "application_started",
  "viewing_scheduled",
  "lease_sent",
  "lease_signed",
  "closed",
  "rejected",
] as const;

export type PipelineColumnId = (typeof PIPELINE_COLUMN_IDS)[number];

export type PipelineColumn = {
  id: PipelineColumnId;
  label: string;
  /** Default stage when a card is dropped on this column */
  targetStage: ApplicationStage;
  /** Application stages that appear in this column */
  stages: ApplicationStage[];
};

export const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    id: "new_deal",
    label: "New deal",
    targetStage: "new",
    stages: ["new"],
  },
  {
    id: "application_started",
    label: "Application started",
    targetStage: "applied",
    stages: ["applied", "screening"],
  },
  {
    id: "viewing_scheduled",
    label: "Viewing scheduled",
    targetStage: "property_viewed",
    stages: ["property_viewed"],
  },
  {
    id: "lease_sent",
    label: "Lease sent",
    targetStage: "lease_sent",
    stages: ["approved", "lease_sent"],
  },
  {
    id: "lease_signed",
    label: "Lease signed",
    targetStage: "lease_signed",
    stages: ["lease_signed"],
  },
  {
    id: "closed",
    label: "Closed / moved in",
    targetStage: "moved_in",
    stages: ["moved_in"],
  },
  {
    id: "rejected",
    label: "Rejected",
    targetStage: "rejected",
    stages: ["rejected"],
  },
];

export const ACTIVE_PIPELINE_COLUMNS = PIPELINE_COLUMNS.filter(
  (c) => c.id !== "rejected"
);

export function stageToColumnId(stage: ApplicationStage): PipelineColumnId {
  for (const column of PIPELINE_COLUMNS) {
    if (column.stages.includes(stage)) return column.id;
  }
  return "new_deal";
}

export function columnIdToTargetStage(columnId: PipelineColumnId): ApplicationStage {
  const column = PIPELINE_COLUMNS.find((c) => c.id === columnId);
  return column?.targetStage ?? "new";
}

export function pipelineColumnLabel(id: PipelineColumnId): string {
  return PIPELINE_COLUMNS.find((c) => c.id === id)?.label ?? id;
}

/** Stages agents may set via the pipeline board */
export const AGENT_PIPELINE_STAGES: ApplicationStage[] = [
  "new",
  "applied",
  "screening",
  "property_viewed",
  "approved",
  "lease_sent",
  "lease_signed",
  "moved_in",
];
