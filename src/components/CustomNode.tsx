import React from "react";
import { Handle, Position } from "reactflow";
import { Cpu, Mail, Globe, Clock, PlayCircle, Terminal } from "lucide-react";

const NODE_ICONS: Record<string, any> = {
  trigger: PlayCircle,
  llm: Cpu,
  http: Globe,
  delay: Clock,
  email: Mail,
  output: Terminal,
};

export const CustomNode = ({ data, type }: any) => {
  const Icon = NODE_ICONS[type] || Terminal;

  return (
    <div className="p-3 min-w-[180px]">
      <div className="flex items-center gap-2 mb-2 border-b border-black/10 pb-2">
        <Icon size={16} />
        <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
          {data.label}
        </span>
      </div>
      <div className="text-[10px] text-black/60 font-medium">
        {data.description || "Configure node settings"}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!bg-black !rounded-none !w-1.5 !h-1.5"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-black !rounded-none !w-1.5 !h-1.5"
      />
    </div>
  );
};
