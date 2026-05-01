export type NodeType = "trigger" | "llm" | "http" | "delay" | "output" | "email";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id?: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionLog {
  timestamp: string;
  level: "info" | "error" | "warn";
  message: string;
  nodeId?: string;
}

export interface Execution {
  id?: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed";
  logs: ExecutionLog[];
  outputs: Record<string, any>;
  startTime: string;
  endTime?: string;
}
