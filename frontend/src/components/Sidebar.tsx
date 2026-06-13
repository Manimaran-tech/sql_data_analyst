import React from 'react';
import { Layers, Terminal, Database, Settings, LayoutDashboard, DatabaseBackup } from 'lucide-react';

interface SidebarProps {
  activeView: 'workspace' | 'dashboard' | 'setup' | 'settings';
  setActiveView: (view: 'workspace' | 'dashboard' | 'setup' | 'settings') => void;
  recordCount: number;
  fileName: string;
  dbType: 'postgres' | 'mongodb' | 'firebase' | 'flatfile';
}

export default function Sidebar({ activeView, setActiveView, recordCount, fileName, dbType }: SidebarProps) {
  return (
    <aside className="w-60 border-r border-slate-800 bg-slate-900 flex flex-col justify-between select-none h-screen sticky top-0 flex-shrink-0">
      {/* Top Banner and Logo */}
      <div className="flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-slate-800">
          <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center mr-3 shadow-md shadow-blue-500/10">
            <Layers className="h-4.5 w-4.5 text-white" />
          </div>
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
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs transition-all duration-150 group relative cursor-pointer ${
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
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs transition-all duration-150 group relative cursor-pointer ${
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
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs transition-all duration-150 group relative cursor-pointer ${
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
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs transition-all duration-150 group relative cursor-pointer ${
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

      {/* Footer Connection status matching images */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex flex-col gap-1.5">
          <div className="text-[9px] tracking-wider font-bold uppercase text-slate-500 font-mono">
            Active Connection:
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex h-1.5 w-1.5 rounded-full ${fileName ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`} />
            <span className={`text-[10px] font-mono font-bold uppercase ${fileName ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fileName ? (dbType === 'flatfile' ? 'Excel / CSV' : dbType.toUpperCase()) : 'Not Connected'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/55 flex flex-col gap-1 text-[10px] text-slate-400 font-mono">
            <div className="truncate">Source: {fileName || 'None'}</div>
            <div>Rows: {fileName ? recordCount.toLocaleString() : '0'} count</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
