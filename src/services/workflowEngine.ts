import { Workflow, WorkflowNode, WorkflowEdge, ExecutionLog } from "../types";
import { runLLMTask } from "./geminiService";

export interface ExecutionContext {
  outputs: Record<string, any>;
  logs: ExecutionLog[];
}

export class WorkflowEngine {
  private workflow: Workflow;
  private ctx: ExecutionContext;
  private onNodeUpdate?: (nodeId: string, status: "running" | "completed" | "error") => void;

  constructor(workflow: Workflow, onNodeUpdate?: any) {
    this.workflow = workflow;
    this.ctx = { outputs: {}, logs: [] };
    this.onNodeUpdate = onNodeUpdate;
  }

  private log(message: string, level: "info" | "error" | "warn" = "info", nodeId?: string) {
    const log: ExecutionLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      nodeId,
    };
    this.ctx.logs.push(log);
    console.log(`[${level.toUpperCase()}] ${message}`);
  }

  async run() {
    this.log("Starting workflow execution...");
    
    // Find trigger node
    const triggerNode = this.workflow.nodes.find(n => n.type === 'trigger');
    if (!triggerNode) {
      this.log("No trigger node found", "error");
      return { success: false, ...this.ctx };
    }

    try {
      await this.executeNode(triggerNode);
      this.log("Workflow execution completed successfully");
      return { success: true, ...this.ctx };
    } catch (e: any) {
      this.log(`Workflow failed: ${e.message}`, "error");
      return { success: false, ...this.ctx };
    }
  }

  private async executeNode(node: WorkflowNode) {
    this.onNodeUpdate?.(node.id, "running");
    this.log(`Executing node: ${node.data.label}`, "info", node.id);

    try {
      let result: any = null;

      switch (node.type) {
        case "trigger":
          result = { triggered: true };
          break;

        case "llm":
          const prompt = node.data.config?.prompt || "Summarize the previous data";
          const system = node.data.config?.systemInstruction;
          // In a real app, we'd interpolate variables from this.ctx.outputs
          result = await runLLMTask(prompt, system);
          break;

        case "http":
          const url = node.data.config?.url;
          if (url) {
            const resp = await fetch(url);
            result = await resp.json();
          }
          break;

        case "delay":
          const ms = (node.data.config?.seconds || 1) * 1000;
          await new Promise(r => setTimeout(r, ms));
          result = { waited: ms };
          break;

        case "output":
          result = this.ctx.outputs;
          break;
      }

      this.ctx.outputs[node.id] = result;
      this.onNodeUpdate?.(node.id, "completed");

      // Find next nodes
      const outgoingEdges = this.workflow.edges.filter(e => e.source === node.id);
      for (const edge of outgoingEdges) {
        const nextNode = this.workflow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          await this.executeNode(nextNode);
        }
      }

    } catch (e: any) {
      this.onNodeUpdate?.(node.id, "error");
      this.log(`Node ${node.id} failed: ${e.message}`, "error", node.id);
      throw e;
    }
  }
}
