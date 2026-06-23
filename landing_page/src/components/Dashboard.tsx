import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Workspace from './Workspace';
import InteractiveDashboard from './InteractiveDashboard';
import DatabaseSetup from './DatabaseSetup';
import Settings from './Settings';
import { SaleRecord, ChatMessage, SwarmResponse } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Download, Sun, Moon, Monitor } from 'lucide-react';
import { User } from 'firebase/auth';

interface DashboardProps {
  onBackToLanding?: () => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  user: User | null;
}

export default function Dashboard({ onBackToLanding, theme, setTheme, user }: DashboardProps) {
  // Database State - initialized to empty as requested
  const [dataset, setDataset] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [hasRunPrompt, setHasRunPrompt] = useState<boolean>(false);

  // Chat memory and visual outputs shared states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [latestDashboardUrl, setLatestDashboardUrl] = useState<string | null>(null);
  const [latestSwarmResult, setLatestSwarmResult] = useState<SwarmResponse | null>(null);

  // Primary Workspace view navigation status
  const [activeView, setActiveView] = useState<'workspace' | 'dashboard' | 'setup' | 'settings'>('workspace');

  // AI Configuration Parameters
  const [activeModel, setActiveModel] = useState<string>(() => {
    return localStorage.getItem('swarm_analyst_model') || 'nvidia/llama-3.3-nemotron-super-49b-v1';
  });
  const [temperature, setTemperature] = useState<number>(0.35);
  const [pacing, setPacing] = useState<'instant' | 'fast' | 'normal'>('fast');

  // Database Connections State
  const [selectedDbType, setSelectedDbType] = useState<'postgres' | 'mongodb' | 'firebase' | 'flatfile'>('flatfile');
  const [postgresCreds, setPostgresCreds] = useState({
    host: 'localhost',
    port: '5432',
    user: 'postgres',
    password: '',
    database: 'postgres'
  });
  const [mongoCreds, setMongoCreds] = useState({
    uri: 'mongodb://localhost:27017',
    database: 'analytics'
  });
  const [firebaseCreds, setFirebaseCreds] = useState({
    service_account_path: '',
    project_id: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<{ table_name: string; file_path: string; original_filename: string }[]>([]);

  // Persist model selection
  useEffect(() => {
    localStorage.setItem('swarm_analyst_model', activeModel);
  }, [activeModel]);

  // Listen to menu navigation events from Tauri Rust backend (fails gracefully in standard web browser)
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<string>('menu-navigate', (event) => {
        const view = event.payload;
        if (view === 'workspace' || view === 'dashboard' || view === 'setup' || view === 'settings') {
          setActiveView(view);
        }
      }).then((unlisten) => {
        unlistenFn = unlisten;
      });
    }).catch(err => {
      console.log("Tauri API event listener not registered (probably running outside Tauri wrapper):", err);
    });

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, []);

  // Handler for custom dataset drops or parses
  const handleDatasetUpdate = (newData: any[], name: string) => {
    if (newData.length > 0) {
      setDataset(newData);
      setFileName(name);
    } else {
      setDataset([]);
      setFileName('');
      setUploadedFiles([]);
      setHasRunPrompt(false);
    }
  };

  // Generate session UUID for offline fallback
  useEffect(() => {
    if (!localStorage.getItem('swarm_session_id')) {
      localStorage.setItem('swarm_session_id', 'session_' + Math.random().toString(36).substring(2, 15));
    }
  }, []);

  return (
    <div className="flex bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 h-screen overflow-hidden text-xs font-sans select-none leading-normal transition-colors duration-200">
      {/* 1. Global Left Navigation Panel */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        recordCount={dataset.length}
        fileName={fileName}
        dbType={selectedDbType}
        onBackToLanding={onBackToLanding}
        user={user}
      />

      {/* 2. Main Visual Stage Frame */}
      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        
        {/* Global Stage Title and stats summary */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-8 flex-shrink-0 select-text transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-xs font-bold uppercase tracking-tight text-slate-800 dark:text-white font-display">
                {activeView === 'workspace' && 'Swarm Workspace Studio'}
                {activeView === 'dashboard' && 'Dashboard Executive Overview'}
                {activeView === 'setup' && 'Database Integration Hub'}
                {activeView === 'settings' && 'Swarm System Configuration'}
              </h1>
              <div className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-sm text-[9px] font-bold uppercase tracking-wider">
                {activeView === 'workspace' && 'REAL-TIME BI'}
                {activeView === 'dashboard' && 'Q3 REPORTING'}
                {activeView === 'setup' && 'DATA CONNECTOR'}
                {activeView === 'settings' && 'AI COGNITIVE ENGINE'}
              </div>
            </div>
          </div>
          
          {/* Top subtle connection breadcrumb mapping & download action */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={() => {
                if (theme === 'system') setTheme('light');
                else if (theme === 'light') setTheme('dark');
                else setTheme('system');
              }}
              className="p-1.5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
            >
              {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
              {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              {theme === 'system' && <Monitor className="w-3.5 h-3.5 text-slate-400" />}
              <span className="text-[10px] font-mono font-bold capitalize hidden md:inline">
                {theme}
              </span>
            </button>

            <a
              href="https://github.com/Manimaran-tech/sql_data_analyst/releases/download/v1.0.0/SwarmAnalyst_1.0.0_x64-setup.exe"
              download
              className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/45 hover:bg-blue-100/80 px-2.5 py-1.5 rounded transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-900/60 cursor-pointer shadow-sm active:scale-95"
            >
              <Download className="h-3 w-3 animate-pulse" />
              Download Windows App
            </a>
          </div>

          <div className="text-xs text-slate-500">
            <span className="mr-2 text-[9px] font-extrabold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Database Source:</span>
            <span className="font-mono text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-1 rounded-sm">
              {fileName || 'Not Connected'}
            </span>
          </div>
        </header>

        {/* 3. Render Active Scene wrapped in premium view transitions */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-zinc-950 select-text">
          <div className="max-w-7xl w-full mx-auto space-y-6">
            <div className="h-full relative">
              <div className={activeView === 'workspace' ? 'block' : 'hidden'}>
                <Workspace
                  dataset={dataset}
                  activeModel={activeModel}
                  selectedDbType={selectedDbType}
                  postgresCreds={postgresCreds}
                  mongoCreds={mongoCreds}
                  firebaseCreds={firebaseCreds}
                  uploadedFiles={uploadedFiles}
                  onInvestigationSuccess={() => setHasRunPrompt(true)}
                  chatHistory={chatHistory}
                  setChatHistory={setChatHistory}
                  latestDashboardUrl={latestDashboardUrl}
                  setLatestDashboardUrl={setLatestDashboardUrl}
                  latestSwarmResult={latestSwarmResult}
                  setLatestSwarmResult={setLatestSwarmResult}
                  setActiveView={setActiveView}
                  user={user}
                />
              </div>

              <div className={activeView === 'dashboard' ? 'block' : 'hidden'}>
                {hasRunPrompt ? (
                  <InteractiveDashboard
                    dataset={dataset}
                    swarmResult={latestSwarmResult}
                    dashboardUrl={latestDashboardUrl}
                  />
                ) : (
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-sm py-16">
                    <div className="h-12 w-12 rounded-full bg-blue-50/80 dark:bg-blue-950/45 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Layers className="h-6 w-6 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-tight">Interactive Dashboard Awaiting Swarm</h3>
                    <p className="text-slate-500 dark:text-zinc-400 max-w-md text-xs leading-normal">
                      No active investigation has been executed. Please first connect a data source in the <strong>Database Integration Hub</strong> and run an analytical query in the <strong>Workspace Studio</strong> to generate the interactive business intelligence dashboard.
                    </p>
                  </div>
                )}
              </div>

              <div className={activeView === 'setup' ? 'block' : 'hidden'}>
                <DatabaseSetup
                  dataset={dataset}
                  onDatasetUpdate={handleDatasetUpdate}
                  fileName={fileName}
                  selectedDbType={selectedDbType}
                  setSelectedDbType={setSelectedDbType}
                  postgresCreds={postgresCreds}
                  setPostgresCreds={setPostgresCreds}
                  mongoCreds={mongoCreds}
                  setMongoCreds={setMongoCreds}
                  firebaseCreds={firebaseCreds}
                  setFirebaseCreds={setFirebaseCreds}
                  uploadedFiles={uploadedFiles}
                  setUploadedFiles={setUploadedFiles}
                  user={user}
                />
              </div>

              <div className={activeView === 'settings' ? 'block' : 'hidden'}>
                <Settings
                  activeModel={activeModel}
                  setActiveModel={setActiveModel}
                  temperature={temperature}
                  setTemperature={setTemperature}
                  pacing={pacing}
                  setPacing={setPacing}
                  user={user}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar Footer in High Density theme */}
        <footer className="h-8 bg-slate-900 flex items-center justify-between px-6 flex-shrink-0 text-[10px] text-slate-400">
          <div className="flex items-center space-x-4 font-mono">
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> 
              System Operational
            </span>
            <span className="text-slate-700">|</span>
            <span>Last Sync: 12 seconds ago</span>
          </div>
          <div className="flex items-center space-x-4 font-mono">
            <span>Database: InMemory DuckDB + CSV</span>
            <span className="text-slate-700">|</span>
            <span>User Latency: 14ms</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
