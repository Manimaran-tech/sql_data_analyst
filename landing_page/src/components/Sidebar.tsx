import React, { useState, useEffect } from 'react';
import { Layers, Terminal, Database, Settings, LayoutDashboard, ArrowLeft, Download, LogOut, Shield } from 'lucide-react';
import { User, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseClient';

interface SidebarProps {
  activeView: 'workspace' | 'dashboard' | 'setup' | 'settings';
  setActiveView: (view: 'workspace' | 'dashboard' | 'setup' | 'settings') => void;
  recordCount: number;
  fileName: string;
  dbType: 'postgres' | 'mongodb' | 'firebase' | 'flatfile';
  onBackToLanding?: () => void;
  user: User | null;
}

export default function Sidebar({
  activeView,
  setActiveView,
  recordCount,
  fileName,
  dbType,
  onBackToLanding,
  user
}: SidebarProps) {
  const [queryCount, setQueryCount] = useState<number>(0);

  // Subscribe to real-time user query count updates from Firestore
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setQueryCount(docSnap.data().queryCount || 0);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (onBackToLanding) {
        onBackToLanding();
      }
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <aside className="w-60 border-r border-slate-800 bg-slate-900 flex flex-col justify-between select-none h-screen sticky top-0 flex-shrink-0">
      {/* Top Banner and Logo */}
      <div className="flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-slate-800">
          <img src="/favicon.png" className="h-8 w-8 mr-3 shadow-md shadow-blue-500/10" alt="SwarmAnalyst Logo" />
          <div>
            <span className="font-bold text-white tracking-tight text-xs font-display uppercase">Swarm</span>
            <span className="font-bold text-blue-500 text-xs font-display uppercase ml-0.5">Analyst</span>
          </div>
        </div>

        {/* Navigation group */}
        <nav className="p-3.5 space-y-1 text-xs font-medium">
          <div className="px-3 py-1.5 text-slate-500 uppercase tracking-widest text-[9px] font-bold mb-1">Intelligence</div>
          
          <button
            onClick={() => setActiveView('workspace')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs transition-all duration-150 group relative cursor-pointer text-left ${
              activeView === 'workspace'
                ? 'bg-blue-600/15 text-white font-semibold border-r-2 border-blue-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className={`h-4 w-4 transition-transform ${
              activeView === 'workspace' ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-400'
            }`} />
            Swarm Workspace
          </button>

          <button
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs transition-all duration-150 group relative cursor-pointer text-left ${
              activeView === 'dashboard'
                ? 'bg-blue-600/15 text-white font-semibold border-r-2 border-blue-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className={`h-4 w-4 transition-transform ${
              activeView === 'dashboard' ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-400'
            }`} />
            BI Analytics Dashboard
          </button>

          <div className="px-3 py-1.5 text-slate-500 uppercase tracking-widest text-[9px] font-bold mb-1 mt-4">Administration</div>

          <button
            onClick={() => setActiveView('setup')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs transition-all duration-150 group relative cursor-pointer text-left ${
              activeView === 'setup'
                ? 'bg-blue-600/15 text-white font-semibold border-r-2 border-blue-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className={`h-4 w-4 transition-transform ${
              activeView === 'setup' ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-400'
            }`} />
            Database Setup
          </button>

          <button
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs transition-all duration-150 group relative cursor-pointer text-left ${
              activeView === 'settings'
                ? 'bg-blue-600/15 text-white font-semibold border-r-2 border-blue-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className={`h-4 w-4 transition-transform ${
              activeView === 'settings' ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-400'
            }`} />
            Settings
          </button>
        </nav>
      </div>

      {/* Footer Actions, User Profile Card, and Connection status */}
      <div className="flex flex-col gap-2 p-4 border-t border-slate-800 bg-slate-950/40">
        
        {/* User profile card */}
        {user && (
          <div className="mb-2 p-3 rounded-lg border border-slate-800/65 bg-slate-900/60 text-xs flex flex-col gap-2.5 shadow-inner">
            <div className="flex items-center gap-2.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-8 w-8 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full border border-slate-700 bg-blue-600 flex items-center justify-center font-bold text-white uppercase">
                  {(user.displayName || user.email || 'U').charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white truncate text-[11px] leading-tight">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-slate-500 truncate leading-none mt-0.5">
                  {user.email}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-800/70 pt-2.5 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-500" />
                Swarms Run:
              </span>
              <span className="font-bold text-white text-[11px]">{queryCount}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full mt-1.5 py-1.5 px-2 bg-slate-800/60 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/40 text-slate-400 hover:text-rose-400 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-97"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        )}

        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="w-full py-2 px-3 border border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded text-[11px] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </button>
        )}

        <a
          href="https://github.com/Manimaran-tech/sql_data_analyst/releases/download/v1.0.0/SwarmAnalyst_1.0.0_x64-setup.exe"
          download
          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition-all flex items-center justify-center gap-2 text-center shadow-md active:scale-95"
        >
          <Download className="h-3.5 w-3.5 animate-bounce" style={{ animationDuration: '3s' }} />
          Download Desktop App
        </a>

        <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-slate-800">
          <div className="text-[9px] tracking-wider font-bold uppercase text-slate-500 font-mono">
            Active Connection:
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex h-1.5 w-1.5 rounded-full ${fileName ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`} />
            <span className={`text-[10px] font-mono font-bold uppercase ${fileName ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fileName ? (dbType === 'flatfile' ? 'Excel / CSV' : dbType.toUpperCase()) : 'Not Connected'}
            </span>
          </div>
          <div className="mt-1 flex flex-col gap-1 text-[10px] text-slate-400 font-mono">
            <div className="truncate">Source: {fileName || 'None'}</div>
            <div>Rows: {fileName ? recordCount.toLocaleString() : '0'} count</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
