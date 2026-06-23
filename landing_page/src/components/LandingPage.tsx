/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Download, 
  Globe, 
  Layers, 
  ArrowRight, 
  Database, 
  Workflow, 
  Cpu, 
  Upload, 
  Play, 
  FileCheck, 
  Monitor, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  AlertCircle,
  Copy,
  Users,
  CheckCircle2,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { User } from 'firebase/auth';
import SwarmCanvas from './SwarmCanvas';
import Documentation from './Documentation';

interface LandingPageProps {
  onViewWebsite: () => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  user: User | null;
}

export default function LandingPage({ onViewWebsite, theme, setTheme, user }: LandingPageProps) {
  // Live Animated Slogan Array for Typewriter
  const slogans = [
    "Everyone is a data analyst.",
    "AI-powered agentic swarm for databases.",
    "Connect Postgres, MongoDB, and Firestore.",
    "Generate rich Seaborn analytics dashboards.",
    "100% offline security & local OS keyring.",
    "Free and open source. Anyone can contribute."
  ];

  const [displayText, setDisplayText] = useState("");
  const [sloganIndex, setSloganIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(60);

  // Typewriter typing animation loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentFullText = slogans[sloganIndex];

    if (isDeleting) {
      timer = setTimeout(() => {
        setDisplayText(currentFullText.substring(0, displayText.length - 1));
        setTypingSpeed(30); // delete faster
      }, typingSpeed);
    } else {
      timer = setTimeout(() => {
        setDisplayText(currentFullText.substring(0, displayText.length + 1));
        setTypingSpeed(75); // normal typing pace
      }, typingSpeed);
    }

    if (!isDeleting && displayText === currentFullText) {
      // Pause at full text
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 1800);
    } else if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setSloganIndex((prev) => (prev + 1) % slogans.length);
      setTypingSpeed(120); // brief delay before next slogan
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, sloganIndex, slogans]);

  // GUI download progress simulation states
  const [downloadingUrl, setDownloadingUrl] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadPlatform, setDownloadPlatform] = useState('Windows x64 Portable (.EXE)');
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isCliOpen, setIsCliOpen] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  // Download setup mapping sizes and formats
  const platformMeta: Record<string, { size: string; format: string; suffix: string; filename: string; url: string }> = {
    'Windows x64 Portable (.EXE)': { 
      size: '94.4 MB', 
      format: 'Portable Executable', 
      suffix: 'exe', 
      filename: 'SwarmAnalyst_1.0.0_x64-setup.exe',
      url: 'https://github.com/Manimaran-tech/sql_data_analyst/releases/download/v1.0.0/SwarmAnalyst_1.0.0_x64-setup.exe'
    },
    'Windows x64 Enterprise Installer (.MSI)': { 
      size: '95.5 MB', 
      format: 'Enterprise MSI Installer', 
      suffix: 'msi', 
      filename: 'SwarmAnalyst_1.0.0_x64_en-US.msi',
      url: 'https://github.com/Manimaran-tech/sql_data_analyst/releases/download/v1.0.0/SwarmAnalyst_1.0.0_x64_en-US.msi'
    },
  };

  const handleInteractiveDownload = () => {
    if (downloadingUrl) return;
    setDownloadingUrl(true);
    setDownloadProgress(0);

    // Simulate high-speed pipeline download
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            triggerFileDownload();
            setDownloadingUrl(false);
          }, 600);
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  const triggerFileDownload = () => {
    const meta = platformMeta[downloadPlatform];
    const link = document.createElement('a');
    link.href = meta.url;
    link.download = meta.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyCliCommand = () => {
    const text = 'npm install -g swarm-analyst-cli';
    navigator.clipboard.writeText(text);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div id="landing-page" className="min-h-screen w-full bg-slate-50 dark:bg-zinc-950 font-sans text-slate-800 dark:text-zinc-200 flex flex-col items-center selection:bg-blue-500/25 selection:text-blue-700 dark:selection:bg-emerald-500/25 dark:selection:text-emerald-300 transition-colors duration-200">
      
      {/* 1. STICKY TOP NAVBAR */}
      <nav id="sticky-navbar" className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand left */}
          <div className="flex items-center space-x-2.5">
            <img src="/favicon.png" className="w-5 h-5" alt="Swarm Analyst Logo" />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">Swarm Analyst</span>
                <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 font-mono px-1.5 py-0.2 rounded font-medium">v1.1</span>
              </div>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono tracking-wider hidden sm:block">Professional BI Local Client</p>
            </div>
          </div>

          {/* Action buttons right */}
          <div className="flex items-center space-x-2.5">
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={() => {
                if (theme === 'system') setTheme('light');
                else if (theme === 'light') setTheme('dark');
                else setTheme('system');
              }}
              className="p-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
            >
              {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
              {theme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
              {theme === 'system' && <Monitor className="w-4 h-4 text-slate-400 dark:text-zinc-500" />}
              <span className="text-[10px] font-mono font-bold capitalize hidden md:inline">
                {theme}
              </span>
            </button>

            <a 
              href="#download-section"
              className="text-xs bg-blue-600 hover:bg-blue-500 select-none text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Download Windows App
            </a>
            {user && (
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono hidden sm:inline">
                Logged in as <strong className="text-slate-600 dark:text-zinc-300 font-semibold">{user.displayName || user.email?.split('@')[0]}</strong>
              </span>
            )}
            <button
              onClick={onViewWebsite}
              className="text-xs border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              {user ? 'Go to Workspace' : 'Open Web Demo'}
            </button>
          </div>
        </div>
      </nav>

      {/* Grid subtle design decorations */}
      <div className="relative w-full overflow-hidden flex flex-col items-center">
        
        {/* Glow ambient backgrounds */}
        <div className="absolute top-[10%] left-[20%] w-[450px] h-[450px] bg-blue-500/4 rounded-full glow-bg pointer-events-none" />
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-indigo-500/4 rounded-full glow-bg pointer-events-none" />

        {/* 2. HERO SECTION */}
        <header id="hero-banner" className="grid-bg w-full border-b border-slate-200 dark:border-zinc-800 py-16 sm:py-24 relative bg-white dark:bg-zinc-900 overflow-hidden transition-colors duration-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10 flex flex-col items-center">
            
            {/* Product Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-100/60 dark:border-blue-900/30 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 mx-auto transition-transform hover:scale-105 duration-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 animate-pulse" />
              <span className="text-[11px] font-mono font-semibold tracking-wider uppercase">Native Windows Installer — v1.1 Stable</span>
            </div>

            {/* Title heading with typewriter typing animation */}
            <h1 className="text-4xl sm:text-5.5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-sans max-w-3xl min-h-[140px] sm:min-h-[170px] flex flex-col items-center justify-center">
              <span>Professional Business Intelligence</span>
              <span className="block mt-3 text-blue-600 dark:text-blue-400 font-bold min-h-[2.5rem]">
                {displayText}
                <span className="inline-block w-2 sm:w-2.5 h-6 sm:h-8 bg-blue-600 dark:bg-blue-400 ml-1.5 animate-pulse rounded-sm align-middle" />
              </span>
            </h1>

            {/* Tagline text */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto font-light">
              Model massive datasets locally as parallel coordinate agents. Swarm Analyst executes high-performance metaheuristic optimization directly on your Windows PC—empowered by the NVIDIA NIM API to dynamically generate coordinate agent topologies on the fly.
            </p>

            {/* Primary action CTA buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#download-section"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-7 py-4 rounded-xl shadow transition-all flex items-center space-x-2 shrink-0 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Windows Installer (x64)</span>
              </a>

              <button
                onClick={onViewWebsite}
                className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-medium text-sm px-7 py-4 rounded-xl transition-all flex items-center space-x-2 shrink-0 cursor-pointer shadow-sm active:scale-95"
              >
                <Monitor className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
                <span>Launch Web Sandbox Demo</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 dark:opacity-40" />
              </button>
            </div>

            {/* Open source license footnote */}
            <div className="flex items-center justify-center space-x-4 text-xs text-slate-500 font-mono pt-2 max-w-md w-full mx-auto">
              <span className="text-blue-600 font-medium">✦ 100% Free Open Source</span>
              <span>•</span>
              <span>Apache License 2.0</span>
              <span>•</span>
              <span>Windows 10 / 11 Native</span>
            </div>
          </div>
        </header>

        {/* 3. PRODUCT OVERVIEW — WHAT IS SWARM ANALYST */}
        <section id="features-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-slate-200">          {/* Section Prose Header */}
          <div className="max-w-4xl text-left space-y-4 mb-14">
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 uppercase tracking-widest font-semibold font-bold">AI-Powered Agentic Swarm</span>
            <h2 className="text-2xl sm:text-3.5xl font-bold tracking-tight text-slate-900 dark:text-white">
              Empowering Everyone to Perform Data Analysis via Agent Swarms
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed font-light">
              Traditional business intelligence requires dedicated data engineering and analytics teams, often relying on complex dashboard builders or cloud data warehouses. 
              <strong> Swarm Analyst v1.1 </strong> makes analytics accessible to everyone. By deploying a collaborative swarm of specialized AI agents (Schema Analyst, Query Writer, QA Evaluator, and Coordinator), Swarm Analyst automatically builds hypotheses, executes safe queries, verifies query outputs, and synthesizes visual enterprise reports—running completely locally on your desktop.
            </p>
          </div>

          {/* Grid capability cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-all hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 shadow-sm group">
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-2.5 rounded-xl max-w-max text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-slate-800 dark:text-zinc-100 font-bold text-sm">Hyper-Local Data Privacy</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Connect directly to Postgres, MongoDB, Firestore, or local CSVs. Swarm Analyst queries data in your local environment, keeping your proprietary records secure.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-all hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 shadow-sm group">
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-2.5 rounded-xl max-w-max text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="text-slate-800 dark:text-zinc-100 font-bold text-sm">Multi-Agent Orchestration</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Specialized Schema, Query, and QA agents work together to formulate hypotheses, write dialects, and verify answers through continuous logical checks.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-all hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 shadow-sm group">
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-2.5 rounded-xl max-w-max text-amber-600 dark:text-amber-400 group-hover:text-amber-500">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-slate-800 dark:text-zinc-100 font-bold text-sm">Zero Cloud Runtime Costs</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                By running queries locally and calling local or remote APIs (like NVIDIA NIM) only for reasoning, you bypass expensive monthly warehouse computing bills.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-all hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 shadow-sm group">
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-2.5 rounded-xl max-w-max text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-500">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-slate-800 dark:text-zinc-100 font-bold text-sm">100% Open Collaborative</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                True to our motto that everyone should perform data analysis, our codebase is fully open source. Anyone can review, run, and extend our agents under the Apache-2.0 license.
              </p>
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS FLOW DIAGRAM */}
        <section id="workflow-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-slate-200 dark:border-zinc-800 scroll-mt-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-medium font-bold">Procedural Sequence</span>
            <h2 className="text-2xl sm:text-3.5xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Three Steps To Multi-Agent Analytics
            </h2>
          </div>

          {/* Connected Flow Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Subtle linking connectors in desktop layout */}
            <div className="hidden md:block absolute top-[44px] left-[20%] right-[20%] h-0.5 bg-slate-200 dark:bg-zinc-800 z-0" />

            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10 group">
              <div className="w-11 h-11 rounded-full bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-slate-500 dark:text-zinc-400 group-hover:border-blue-500/60 dark:group-hover:border-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shadow shadow-slate-100 dark:shadow-none">
                1
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl w-full max-w-sm space-y-2 shadow-sm">
                <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm">Connect Data Sources</h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-normal">
                  Integrate PostgreSQL, MongoDB, Firebase, or drag-and-drop local CSV/Excel sheets directly into the connection hub.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10 group">
              <div className="w-11 h-11 rounded-full bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-slate-500 dark:text-zinc-400 group-hover:border-blue-500/60 dark:group-hover:border-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shadow shadow-slate-100 dark:shadow-none">
                2
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl w-full max-w-sm space-y-2 shadow-sm">
                <Play className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto animate-pulse" />
                <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm">Query the Agent Swarm</h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-normal">
                  Type any business question in plain English. The coordinator agent generates investigative hypotheses and directs other agents to analyze the data.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10 group">
              <div className="w-11 h-11 rounded-full bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-slate-500 dark:text-zinc-400 group-hover:border-blue-500/60 dark:group-hover:border-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shadow shadow-slate-100 dark:shadow-none">
                3
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl w-full max-w-sm space-y-2 shadow-sm">
                <FileCheck className="w-5 h-5 text-amber-500 dark:text-amber-400 mx-auto" />
                <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm">Review & Export Insights</h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-normal">
                  Interact with live charts, download the high-density Seaborn dashboard PNG, or save your report as Markdown and SQL files.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* 5. DOWNLOAD SECTION */}
        <section id="download-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-slate-200 dark:border-zinc-800 scroll-mt-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left spec requirements block (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-medium font-bold">Platform Distribution</span>
              <h2 className="text-2xl sm:text-3.5xl font-bold tracking-tight text-slate-900 dark:text-white">
                Download Swarm Analyst
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-light">
                Swarm Analyst publishes pre-compiled native Windows binaries, allowing instant local workstation execution without heavy cloud database overhead. Select your preferred package type and click download.
              </p>

              {/* Requirement points list */}
              <div className="bg-slate-100 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-4 sm:p-5 rounded-2xl space-y-3 font-mono text-[11px] text-slate-600 dark:text-zinc-300">
                <h4 className="text-slate-800 dark:text-zinc-300 text-[10px] uppercase tracking-wider font-bold">Minimum System Requirements</h4>
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-slate-400 dark:text-zinc-500">Operating OS:</span>
                  <span>Windows 10, 11 (64-bit)</span>
                  <span className="text-slate-400 dark:text-zinc-500">Memory Cap:</span>
                  <span>8 GB RAM recommended</span>
                  <span className="text-slate-400 dark:text-zinc-500">Core Runtime:</span>
                  <span>DirectNative Intel/AMD x64 instructions</span>
                  <span className="text-slate-400 dark:text-zinc-500">License:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Apache v2.0 (Free to use)</span>
                </div>
              </div>
            </div>

            {/* Right download download card (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-5">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Release Version 1.1</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-1">Status: Stable Release Build — June 2026</p>
                </div>
                
                {/* Notes triggering modal link */}
                <button
                  onClick={() => setIsNotesOpen(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-mono flex items-center space-x-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Release Notes</span>
                </button>
              </div>

              {/* Select Platform UI */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Select Target Binary Platform</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.keys(platformMeta).map((platform) => {
                    const isChoice = downloadPlatform === platform;
                    return (
                      <button
                        key={platform}
                        onClick={() => setDownloadPlatform(platform)}
                        className={`text-left text-xs p-3 rounded-xl border transition-all cursor-pointer font-medium ${
                          isChoice
                            ? 'border-blue-500/50 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 shadow-sm'
                            : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        {platform}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Central download CTA and progress bar indicator */}
              <div className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{downloadPlatform}</span>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                      File format: {platformMeta[downloadPlatform].suffix.toUpperCase()} • Size: {platformMeta[downloadPlatform].size}
                    </p>
                  </div>

                  <button
                    onClick={handleInteractiveDownload}
                    disabled={downloadingUrl}
                    className={`px-5 py-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer border border-transparent shrink-0 ${
                      downloadingUrl
                        ? 'bg-slate-200 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow active:scale-95'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingUrl ? 'Compiling Package...' : 'Download v1.1'}</span>
                  </button>
                </div>

                {/* Progress bar */}
                {downloadingUrl && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500 dark:text-zinc-400">Resolving dependencies, streaming setup instructions...</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{downloadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200/60 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 dark:bg-blue-400 h-full rounded-full transition-all duration-100"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </section>

        {/* 6. STEP-BY-STEP INSTALLATION & USAGE GUIDE */}
        <section id="guide-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-b border-slate-200 dark:border-zinc-800">
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-medium">End-to-End Walkthrough</span>
            <h2 className="text-2xl sm:text-3.5xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Installation & Deployment Playbook
            </h2>
          </div>

          {/* Numbered Vertical List */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-12">
            
            {/* Left Steps Panel */}
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs flex items-center justify-center">01</div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Download Swarm Analyst Desktop Setup</h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mt-1.5">
                    Acquire the standalone package suited to your Windows workstation (EXE setup or MSI installer) using the download panel above.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs flex items-center justify-center">02</div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Run Installer Wizard</h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mt-1.5">
                    Double-click the installer package and follow standard Windows setup prompts. The application compiles natively with zero external dependencies.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs flex items-center justify-center">03</div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Configure AI Model & Keys</h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mt-1.5">
                    Launch Swarm Analyst from the Windows Start menu. Set your preferred model in Settings and provide an API key, stored securely in the local OS keyring.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Steps Panel */}
            <div className="space-y-8">
              {/* Step 4 */}
              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs flex items-center justify-center">04</div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Integrate Your Databases</h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mt-1.5">
                    Navigate to the Database Integration Hub. Connect your Postgres, MongoDB, or Firestore databases, or drag-and-drop a local CSV file.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs flex items-center justify-center">05</div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Run Natural Language Analysis</h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mt-1.5">
                    Go to Workspace Studio, type your query in English, and run it. Watch Schema, Query Writer, Coordinator, and QA agents run and debug queries live.
                  </p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs flex items-center justify-center">06</div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Explore visual Dashboards & Export</h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mt-1.5">
                    Analyze the generated executive report and interactive charts. Download high-density Seaborn dashboard PNGs, Markdown reports, or SQL scripts.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 7. DOCUMENTATION SECTION */}
        <Documentation />

        {/* 8. WEB VERSION BANNER */}
        <section id="web-banner-section" className="w-full bg-gradient-to-r from-blue-50/50 via-slate-100 to-indigo-50/40 dark:from-zinc-900/50 dark:via-zinc-950 dark:to-zinc-900/50 py-20 border-t border-b border-slate-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-semibold">Zero Deployment Overhead</span>
            <h2 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Instant Swarm Playground — In-Browser Sandbox
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed max-w-3xl mx-auto font-light">
              Don't want to deploy standalone binary setups? No problem. Launch the cloud-hosted companion web app directly in a secure webpage sandbox. Fully functional, responsive, and compatible with any tablet, mobile, or desktop interface.
            </p>

            <div className="pt-3">
              <button
                onClick={onViewWebsite}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-8 py-4 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer inline-flex items-center space-x-2"
              >
                <Globe className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '6s' }} />
                <span>Launch Web Companion Console</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* 9. FOOTER */}
      <footer id="app-footer" className="w-full border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-12 relative z-10 font-mono text-xs text-slate-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Logo brand copyrights */}
          <div className="space-y-2 text-left">
            <div className="flex items-center space-x-2">
              <img src="/favicon.png" className="w-4 h-4" alt="Swarm Analyst Logo" />
              <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-white">Swarm Analyst Client</span>
            </div>
            <p className="text-slate-400 dark:text-zinc-500 text-[10px] leading-relaxed">
              Copyright © 2026 Swarm Core Heuristics Inc. All rights reserved. <br />
              Published open source under the generous Apache-2.0 License guidelines.
            </p>
          </div>

          {/* Links cluster */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px]">
            <a href="#doc-section" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Documentation</a>
            <span>•</span>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">GitHub Portal</a>
            <span>•</span>
            <a href="mailto:contribute@swarm.org" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Developer Contact</a>
            <span>•</span>
            <a href="#doc-section" className="hover:text-slate-800 dark:hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>

      {/* Interactive Release Notes Modal */}
      {isNotesOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4 relative shadow-2xl">
            <button
              onClick={() => setIsNotesOpen(false)}
              className="absolute top-4 right-4 text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-sans">Release Notes — v1.1.0 Stable</h3>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">Published: June 13, 2026</p>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto text-xs leading-relaxed text-slate-700 dark:text-zinc-300 pr-2">
              <h4 className="font-bold text-slate-800 dark:text-zinc-200">What's New in Swarm Analyst 1.1</h4>
              <ul className="list-disc list-inside space-y-1.5 pl-1.5 text-slate-600 dark:text-zinc-400">
                <li><strong className="text-blue-600 dark:text-blue-400">Improved Query Writer Agent:</strong> Added robust query auto-correction loops and native dialect translation for PostgreSQL, MongoDB Aggregations, and Firebase Firestore.</li>
                <li><strong className="text-indigo-600 dark:text-indigo-400">Local OS Keyring Support:</strong> Secure storage of your NVIDIA NIM API credentials inside the local operating system vault.</li>
                <li><strong className="text-amber-600 dark:text-amber-400">High-Density Seaborn Visualizations:</strong> Generates advanced executive panels, trend lines, and KPI cards on port 8002 automatically.</li>
                <li><strong className="text-cyan-600 dark:text-cyan-400">Tauri Desktop Wrapper:</strong> Standalone, zero-dependency MSI and EXE installers compiled for 64-bit Windows environments.</li>
              </ul>

              <h4 className="font-bold text-slate-800 dark:text-zinc-200 pt-2">Bug Fixes & System Stability</h4>
              <ul className="list-disc list-inside space-y-1.5 pl-1.5 text-slate-500 dark:text-zinc-400">
                <li>Corrected connection timeout handlers and auth token exceptions in Firestore and MongoDB database adapters.</li>
                <li>Addressed memory leaks and process loops in the PyInstaller sidecar binary during large dataset parses inside local DuckDB.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-right">
              <button
                onClick={() => setIsNotesOpen(false)}
                className="bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
              >
                Close Release Notes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
