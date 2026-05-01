import React, { useState, useEffect } from "react";
import { Plus, Clock, ArrowRight, Play, LayoutGrid, LayoutList, Zap } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Workflow } from "../types";
import { formatDate } from "../lib/utils";

export const Dashboard = ({ onSelectWorkflow, onNewWorkflow }: any) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "workflows"),
      where("ownerId", "==", auth.currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Workflow));
      setWorkflows(docs);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-12 text-center font-mono opacity-50 uppercase text-xs">Loading Workflows...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-12 border-b border-black pb-8">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter uppercase font-serif mb-2">My Workflows</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-black/60">Manage your AI automation library</p>
        </div>
        
        <button
          onClick={onNewWorkflow}
          className="flex items-center gap-3 bg-black text-white px-6 py-4 font-bold uppercase tracking-widest text-xs hover:translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(20,20,20,0.2)] transition-all"
        >
          <Plus size={18} />
          Create New
        </button>
      </div>

      <div className="mb-16">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 mb-6 flex items-center gap-2">
          <Zap size={14} /> Recommended Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: "Email Summarizer", desc: "Summarize incoming support emails" },
            { name: "Sentiment Agent", desc: "Analyze feedback sentiment" },
            { name: "Data Scraper", desc: "Extract & transform web data" },
            { name: "Daily Report", desc: "Consolidate news to slack" }
          ].map((t, i) => (
            <div 
               key={i} 
               className="p-4 border border-black/10 bg-white hover:border-black cursor-pointer transition-all"
               onClick={() => onNewWorkflow()}
            >
              <h4 className="text-[11px] font-bold uppercase mb-1">{t.name}</h4>
              <p className="text-[10px] opacity-50 mb-3">{t.desc}</p>
              <div className="flex items-center gap-1 text-[8px] font-bold uppercase">Use Template <ArrowRight size={10} /></div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 mb-6 flex items-center gap-2">
        <LayoutList size={14} /> All Automations
      </h2>

      {workflows.length === 0 ? (
        <div className="border-2 border-dashed border-black/20 p-24 text-center">
            <p className="font-mono text-sm uppercase opacity-50 mb-6">No workflows created yet</p>
            <button onClick={onNewWorkflow} className="text-xs font-bold uppercase underline tracking-widest">Start your first automation</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              onClick={() => onSelectWorkflow(wf)}
              className="group bg-white border border-black p-6 cursor-pointer hover:shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] transition-all flex flex-col h-64"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="px-2 py-1 bg-black text-white text-[9px] font-bold uppercase tracking-widest">
                    Active
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-mono opacity-50 uppercase">
                    <Clock size={10} />
                    {formatDate(wf.updatedAt)}
                  </div>
                </div>
                <h3 className="text-xl font-bold tracking-tight uppercase group-hover:underline underline-offset-4 decoration-2 mb-2">
                  {wf.name}
                </h3>
                <p className="text-xs text-black/60 line-clamp-2 italic">
                  {wf.nodes.length} nodes connected • Auto-scaling enabled
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-black/5">
                <div className="flex gap-1">
                  {wf.nodes.slice(0, 3).map((n, i) => (
                    <div key={i} className="w-6 h-6 border border-black flex items-center justify-center text-[10px] font-bold bg-gray-50">
                      {n.type[0].toUpperCase()}
                    </div>
                  ))}
                  {wf.nodes.length > 3 && <div className="text-[10px] font-bold flex items-center ml-1">+{wf.nodes.length - 3}</div>}
                </div>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
