/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, signInWithGoogle } from "./lib/firebase";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { WorkflowEditor } from "./components/WorkflowEditor";
import { Workflow } from "./types";
import { ReactFlowProvider } from "reactflow";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, Zap, ArrowRight, ShieldCheck } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "editor">("dashboard");
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const handleSelectWorkflow = (wf: Workflow) => {
    setCurrentWorkflow(wf);
    setView("editor");
  };

  const handleNewWorkflow = () => {
    setCurrentWorkflow(null);
    setView("editor");
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-[--color-brand-bg] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md w-full bg-white border border-black p-12 text-center shadow-[24px_24px_0px_0px_rgba(20,20,20,1)]"
        >
          <div className="bg-black text-white w-16 h-16 flex items-center justify-center mx-auto mb-8">
            <Zap size={32} />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase font-serif mb-4 italic">
            AI Workflow<br/>Automator
          </h1>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-black/50 mb-12">
            Build specialized AI agents in minutes
          </p>
          
          <div className="space-y-4 mb-12 text-left">
            {[
              "Visual Drag-Drop Builder",
              "Gemini 3.1 Pro Integration",
              "Execute via Webhooks & HTTP",
              "Real-time Monitoring"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest border-b border-black/10 pb-2">
                <ShieldCheck size={14} className="text-black" />
                {text}
              </div>
            ))}
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-black/90 transition-all flex items-center justify-center gap-2"
          >
            Sign In with Google
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-brand-bg]">
      <Navbar />
      
      <main className="h-[calc(100vh-3.5rem)]">
        <AnimatePresence mode="wait">
          {view === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Dashboard 
                onSelectWorkflow={handleSelectWorkflow}
                onNewWorkflow={handleNewWorkflow}
              />
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <div className="bg-white border-b border-black px-6 py-2 flex items-center justify-between">
                <button 
                  onClick={() => setView("dashboard")}
                  className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:underline"
                >
                  Dashboard
                </button>
                <div className="text-[11px] font-bold uppercase italic font-serif">
                   Editing: {currentWorkflow?.name || "New Workflow"}
                </div>
                <div />
              </div>
              <ReactFlowProvider>
                <WorkflowEditor 
                  workflow={currentWorkflow} 
                  onSave={() => setView("dashboard")}
                />
              </ReactFlowProvider>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

