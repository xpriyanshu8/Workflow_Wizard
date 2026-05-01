import React, { useState, useCallback, useRef } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomNode } from "./CustomNode";
import { WorkflowEngine } from "../services/workflowEngine";
import { 
  Play, 
  Save, 
  Plus, 
  Trash2, 
  Settings2,
  Cpu,
  Mail,
  Globe,
  Clock,
  Terminal,
  Zap,
  ChevronRight,
  ListFilter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";

const nodeTypes = {
  trigger: CustomNode,
  llm: CustomNode,
  http: CustomNode,
  delay: CustomNode,
  email: CustomNode,
  output: CustomNode,
};

const initialNodes = [
  {
    id: "1",
    type: "trigger",
    data: { label: "Manual Trigger", description: "Start workflow manually" },
    position: { x: 250, y: 50 },
  },
];

const NODE_TEMPLATES = [
  { type: "llm", label: "AI Agent (Gemini)", icon: Cpu, description: "Process text with LLM" },
  { type: "http", label: "Webhook/API", icon: Globe, description: "Send HTTP request" },
  { type: "delay", label: "Wait/Delay", icon: Clock, description: "Pause workflow" },
  { type: "email", label: "Send Email", icon: Mail, description: "Notify via email" },
  { type: "output", label: "Output log", icon: Terminal, description: "Display result" },
];

export const WorkflowEditor = ({ workflow, onSave }: any) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const reactFlowWrapper = useRef<any>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = (_: any, node: any) => setSelectedNode(node);
  const onPaneClick = () => setSelectedNode(null);

  const addNode = (type: string, label: string) => {
    const newNode = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label, config: {} },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleSave = async () => {
    if (!auth.currentUser) return alert("Please sign in to save");
    
    const data = {
      name: workflow?.name || "Untitled Workflow",
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
      ownerId: auth.currentUser.uid,
    };

    try {
      if (workflow?.id) {
        await updateDoc(doc(db, "workflows", workflow.id), data);
      } else {
        await addDoc(collection(db, "workflows"), {
          ...data,
          createdAt: new Date().toISOString(),
        });
      }
      onSave?.();
    } catch (e) {
      console.error(e);
    }
  };

  const executeWorkflow = async () => {
    setIsExecuting(true);
    setShowLogs(true);
    setExecutionLogs([]);

    const workflowData = {
      name: workflow?.name || "Temp Workflow",
      nodes,
      edges,
      ownerId: auth.currentUser?.uid || "",
      createdAt: "",
      updatedAt: "",
    };

    const engine = new WorkflowEngine(workflowData, (nodeId: string, status: string) => {
      setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, status } } : n));
    });

    const result = await engine.run();
    setExecutionLogs(result.logs);
    setIsExecuting(false);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-[--color-brand-bg]">
      {/* Sidebar */}
      <aside className="w-72 border-r border-black bg-white flex flex-col p-6 gap-6">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-4 font-mono">
            Node Library
          </h2>
          <div className="grid gap-2">
            {NODE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.type}
                onClick={() => addNode(tpl.type, tpl.label)}
                className="flex items-center gap-3 p-3 border border-black group hover:bg-black hover:text-white transition-all text-left"
              >
                <tpl.icon size={18} className="group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide leading-none mb-1">
                    {tpl.label}
                  </div>
                  <div className="text-[9px] opacity-60 leading-tight">
                    {tpl.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
           <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 p-3 border border-black font-bold uppercase text-xs tracking-widest hover:bg-black hover:text-white transition-all"
          >
            <Save size={16} />
            Save Workflow
          </button>
        </div>
      </aside>

      {/* Editor Canvas */}
      <main className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          className="bg-[--color-brand-bg]"
        >
          <Background color="#141414 opacity-10" gap={20} size={1} />
          <Controls className="!bg-white !shadow-none !border !border-black !rounded-none" />
          
          <Panel position="top-right" className="flex gap-2">
            <button
              onClick={executeWorkflow}
              disabled={isExecuting}
              className={`flex items-center gap-2 px-4 py-2 bg-black text-white font-bold uppercase text-[10px] tracking-widest hover:bg-black/80 transition-all ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isExecuting ? <Zap size={14} className="animate-pulse" /> : <Play size={14} />}
              {isExecuting ? "Executing..." : "Run Workflow"}
            </button>
          </Panel>
        </ReactFlow>

        {/* Properties Panel Overlay */}
        <AnimatePresence>
          {(selectedNode || showLogs) && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute right-6 top-6 bottom-6 w-96 bg-white border border-black p-0 z-50 flex flex-col shadow-[12px_12px_0px_0px_rgba(20,20,20,0.05)]"
            >
              <div className="flex border-b border-black">
                <button 
                  onClick={() => setShowLogs(false)}
                  className={`flex-1 p-3 text-[10px] font-bold uppercase tracking-widest ${!showLogs ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                  Properties
                </button>
                <button 
                  onClick={() => setShowLogs(true)}
                  className={`flex-1 p-3 text-[10px] font-bold uppercase tracking-widest ${showLogs ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                  Logs
                </button>
                <button onClick={() => { setSelectedNode(null); setShowLogs(false); }} className="p-3 hover:bg-gray-100 uppercase text-[10px] font-bold border-l border-black">×</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {!showLogs ? (
                  selectedNode ? (
                    <div className="font-mono text-[11px] space-y-6">
                      <div>
                        <label className="block mb-2 text-black/50 uppercase tracking-tighter">Node Label</label>
                        <input 
                          type="text" 
                          value={selectedNode.data.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: val } } : n));
                          }}
                          className="w-full p-2 border border-black focus:outline-none focus:bg-gray-50 bg-transparent"
                        />
                      </div>

                      {selectedNode.type === 'llm' && (
                        <>
                          <div>
                            <label className="block mb-2 text-black/50 uppercase tracking-tighter">System Instruction</label>
                            <textarea 
                              value={selectedNode.data.config?.systemInstruction || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, config: { ...n.data.config, systemInstruction: val } } } : n));
                              }}
                              className="w-full h-24 p-2 border border-black focus:outline-none bg-transparent"
                              placeholder="e.g. You are a creative writer..."
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-black/50 uppercase tracking-tighter">User Prompt</label>
                            <textarea 
                               value={selectedNode.data.config?.prompt || ""}
                               onChange={(e) => {
                                 const val = e.target.value;
                                 setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, config: { ...n.data.config, prompt: val } } } : n));
                               }}
                              className="w-full h-32 p-2 border border-black focus:outline-none bg-transparent"
                              placeholder="Describe the task for Gemini..."
                            />
                          </div>
                        </>
                      )}

                      {selectedNode.type === 'http' && (
                        <div>
                          <label className="block mb-2 text-black/50 uppercase tracking-tighter">Target URL</label>
                          <input 
                            type="text" 
                             value={selectedNode.data.config?.url || ""}
                             onChange={(e) => {
                               const val = e.target.value;
                               setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, config: { ...n.data.config, url: val } } } : n));
                             }}
                            className="w-full p-2 border border-black focus:outline-none bg-transparent" 
                            placeholder="https://api.example.com/endpoint" 
                          />
                        </div>
                      )}

                      <div className="pt-8 mt-auto">
                        <button 
                          onClick={() => {
                            setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                            setSelectedNode(null);
                          }}
                          className="flex items-center justify-center gap-2 w-full p-3 border border-red-500 text-red-500 font-bold uppercase text-[10px] hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete Node
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 opacity-30 text-[10px] uppercase font-bold tracking-widest">Select a node to configure</div>
                  )
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-2 py-1">Live Execution Log</h4>
                    </div>
                    <div className="font-mono text-[9px] space-y-2">
                       {executionLogs.length === 0 && <div className="opacity-40 italic">Waiting for execution...</div>}
                       {executionLogs.map((log, i) => (
                         <div key={i} className={`p-2 border-l-2 ${log.level === 'error' ? 'border-red-500 bg-red-50' : 'border-black bg-gray-50'}`}>
                           <div className="flex justify-between items-center opacity-50 mb-1">
                             <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                             <span className="uppercase text-[8px] font-bold">{log.level}</span>
                           </div>
                           <div className="leading-tight text-black">{log.message}</div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
