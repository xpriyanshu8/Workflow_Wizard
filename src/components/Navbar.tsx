import React, { useState, useEffect } from "react";
import { auth, signInWithGoogle } from "../lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { LogIn, LogOut, Cpu, Zap } from "lucide-react";
import { motion } from "motion/react";

export const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  return (
    <nav className="h-14 border-b border-black flex items-center justify-between px-6 bg-white z-50">
      <div className="flex items-center gap-2">
        <div className="bg-black text-white p-1">
          <Zap size={18} />
        </div>
        <span className="font-bold tracking-tighter text-lg uppercase italic font-serif">
          Workflow Automator
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-medium hidden sm:block">
              {user.email}
            </span>
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-2 px-3 py-1.5 border border-black text-[11px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-black/80 transition-colors"
          >
            <LogIn size={14} />
            Connect Google
          </button>
        )}
      </div>
    </nav>
  );
};
