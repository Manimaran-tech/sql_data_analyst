/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  BookOpen, 
  Cpu, 
  Terminal, 
  Users, 
  Layers, 
  CheckCircle, 
  Database,
  Lightbulb,
  Workflow,
  Sparkles,
  Link2
} from 'lucide-react';
import { DocTab } from '../types';

export default function Documentation() {
  const [activeTab, setActiveTab] = useState<DocTab>('getting-started');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeSnippets = {
    installDeps: `cd sql_data_analyst
npm install`,
    runDev: `# Terminal 1: Launch Backend
python run_backend.py

# Terminal 2: Launch Tauri Desktop App
cd frontend
npm run tauri dev`,
    runTests: `python run_tests.py`,
    postgresConfig: `{
  "host": "localhost",
  "port": "5432",
  "user": "postgres",
  "password": "your_secure_password",
  "database": "sales_analytics"
}`,
    mongoConfig: `{
  "uri": "mongodb://localhost:27017",
  "database": "customer_data"
}`,
    firebaseConfig: `{
  "service_account_path": "C:\\\\credentials\\\\firebase-key.json",
  "project_id": "my-firebase-app-id"
}`
  };

  return (
    <section id="doc-section" className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 py-16 scroll-mt-16 w-full transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 px-3 py-1 rounded-full mb-4">
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-mono font-medium text-blue-700 dark:text-blue-300 uppercase tracking-widest">
              Core Documentation & User Manual
            </span>
          </div>
          <h2 className="text-2xl sm:text-3.5xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            Open-Source Swarm Analyst v1.1
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-light">
            A secure, offline-first multi-agent SQL & database analysis workstation. We believe everyone should perform data analysis, which is why Swarm Analyst is completely open source and community-governed.
          </p>
        </div>

        {/* Documentation Framework Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Docs Tab Sidebar (3-columns) */}
          <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('getting-started')}
              className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold flex items-center space-x-2.5 transition-all outline-none shrink-0 cursor-pointer ${
                activeTab === 'getting-started'
                  ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500/30 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 font-medium'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>Getting Started</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold flex items-center space-x-2.5 transition-all outline-none shrink-0 cursor-pointer ${
                activeTab === 'architecture'
                  ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500/30 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 font-medium'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Workflow className="w-4 h-4 shrink-0" />
              <span>Swarm Architecture</span>
            </button>

            <button
              onClick={() => setActiveTab('database-setup')}
              className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold flex items-center space-x-2.5 transition-all outline-none shrink-0 cursor-pointer ${
                activeTab === 'database-setup'
                  ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500/30 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 font-medium'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>Database Connection</span>
            </button>

            <button
              onClick={() => setActiveTab('contribute')}
              className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold flex items-center space-x-2.5 transition-all outline-none shrink-0 cursor-pointer ${
                activeTab === 'contribute'
                  ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500/30 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 font-medium'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Contributor Guide</span>
            </button>
          </div>

          {/* Docs Frame Panel (9-columns) */}
          <div className="lg:col-span-9 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 rounded-3xl min-h-[460px] shadow-sm transition-colors duration-200">
            
            {/* GETTING STARTED TAB */}
            {activeTab === 'getting-started' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Getting Started with Swarm Analyst</h3>
                  <p className="text-slate-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed">
                    Swarm Analyst allows anyone to query databases and spreadsheets in plain English. Instead of writing complex queries or building visual tables, Swarm Analyst deploys a local team of cooperative AI agents that inspects database schemas, writes appropriate queries, evaluates outputs for correctness, and generates dashboards entirely offline.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-4 rounded-xl flex items-start space-x-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-normal">
                    <strong>Zero-Dependency Standalone Build:</strong> The desktop app runs as a native Tauri application on Windows, communicating with a lightweight local FastAPI backend (port <code>8002</code>). It securely stores your NVIDIA NIM API keys inside the operating system's native credentials keyring.
                  </p>
                </div>

                {/* Step-by-Step UI Guide */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 font-mono">How to Run and Connect Your App</h4>
                  <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-zinc-300 space-y-2.5">
                    <li>
                      <strong>Install the Desktop Application:</strong> Run the downloaded installer (<code>SwarmAnalyst_1.0.0_x64-setup.exe</code> or <code>SwarmAnalyst_1.0.0_x64_en-US.msi</code>) to deploy the client.
                    </li>
                    <li>
                      <strong>Input API Credentials:</strong> Open the app, click <strong>Settings</strong>, and enter your NVIDIA NIM API Key. Click <strong>Save Key</strong>. This saves the credentials securely in your Windows OS Credential Vault.
                    </li>
                    <li>
                      <strong>Integrate Your Database:</strong> Go to the <strong>Database Integration Hub</strong>. Choose your database type (PostgreSQL, MongoDB, Firebase, or Flat file CSV/Excel) and click <strong>Test Connection</strong>. You will see a live preview of the tables and schemas once connected.
                    </li>
                    <li>
                      <strong>Ask Analytical Questions:</strong> Head to <strong>Swarm Workspace Studio</strong>, type any data query (e.g. <em>"Show me total monthly revenue for 2025 grouped by region"</em>) and click <strong>Run Swarm</strong>.
                    </li>
                    <li>
                      <strong>Inspect Real-Time Logs & Dashboard:</strong> Watch the agent swarm coordinate in real time. Once approved, review the executive analytical report, click <strong>Dashboard Overview</strong> to interact with the visualizations, and download reports, query logs, or charts.
                    </li>
                  </ol>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-medium">Local Backend Port Settings</span>
                  <div className="bg-slate-900 dark:bg-zinc-950 border border-slate-800 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between font-mono text-xs">
                    <span className="text-emerald-400 dark:text-emerald-300">WebSocket Endpoint: ws://127.0.0.1:8002/ws/swarm</span>
                    <button
                      onClick={() => copyToClipboard('ws://127.0.0.1:8002/ws/swarm', 'ws')}
                      className="text-[10px] bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-800 hover:border-slate-600 dark:hover:border-zinc-700 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-colors"
                    >
                      {copiedCode === 'ws' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SWARM ARCHITECTURE TAB */}
            {activeTab === 'architecture' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-sans">Multi-Agent Swarm Collaboration</h3>
                  <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed">
                    Swarm Analyst replaces heavy cloud query engines with a swarm of lightweight, cooperative, specialized agents. Each agent handles a key component of the data analysis pipeline:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50/60 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 p-4 rounded-xl space-y-1">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase font-mono">Schema Analyst Agent</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-normal">
                      Inspects schema metadata directly. Analyzes keys, foreign relationships, and field properties, selecting tables/collections relevant to your question.
                    </p>
                  </div>

                  <div className="bg-slate-50/60 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 p-4 rounded-xl space-y-1">
                    <div className="flex items-center space-x-2">
                      <Workflow className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase font-mono">Coordinator Agent</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-normal">
                      Acts as the swarm manager. Formulates analytical hypotheses (sub-tasks), aggregates results, and designs final executive summaries and chart layouts.
                    </p>
                  </div>

                  <div className="bg-slate-50/60 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 p-4 rounded-xl space-y-1">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase font-mono">Query Writer Agent</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-normal">
                      Translates Coordinator requests into database commands. Supports PostgreSQL SQL SELECT, MongoDB aggregation JSONs, and Firestore structured criteria.
                    </p>
                  </div>

                  <div className="bg-slate-50/60 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 p-4 rounded-xl space-y-1">
                    <div className="flex items-center space-x-2">
                      <Link2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase font-mono">Execution Agent</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-normal">
                      Safely runs generated commands against active connections. Relays successful result tables and intercepts database syntax errors.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 p-4.5 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase font-mono">QA & Evaluator Agent (Double-Loop Verification)</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-normal">
                    Validates calculation sanity. If a query returns empty sets or database errors, it sends detailed feedback to the Query Writer Agent for auto-correction (up to 3 retries). It performs final evaluation on the report's correctness against user criteria before rendering charts.
                  </p>
                </div>
              </div>
            )}

            {/* DATABASE SETUP TAB */}
            {activeTab === 'database-setup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Database Connection Playbook</h3>
                  <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed">
                    Configure your data sources in the Database Integration Hub. Swarm Analyst dynamically handles dialect translations.
                  </p>
                </div>

                {/* Database Adapters Details */}
                <div className="space-y-5">
                  
                  {/* Postgres */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 font-mono">PostgreSQL Connector Setup</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed pl-4">
                      Connect to enterprise relational schemas. Requires active database credentials. The Query Writer compiles standard ANSI SQL statements.
                    </p>
                    <div className="bg-slate-900 dark:bg-zinc-950 border border-slate-800 dark:border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-zinc-300 relative overflow-x-auto">
                      <pre className="text-left whitespace-pre">{codeSnippets.postgresConfig}</pre>
                      <button
                        onClick={() => copyToClipboard(codeSnippets.postgresConfig, 'pg')}
                        className="absolute top-4 right-4 text-[10px] bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-800 hover:border-slate-600 dark:hover:border-zinc-700 px-2 py-1 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-colors"
                      >
                        {copiedCode === 'pg' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* MongoDB */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 font-mono">MongoDB Document Connector</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed pl-4">
                      Connects via Standard connection strings. Swarm Analyst reflects collection fields and writes MongoDB Aggregation Pipelines in JSON.
                    </p>
                    <div className="bg-slate-900 dark:bg-zinc-950 border border-slate-800 dark:border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-zinc-300 relative overflow-x-auto">
                      <pre className="text-left whitespace-pre">{codeSnippets.mongoConfig}</pre>
                      <button
                        onClick={() => copyToClipboard(codeSnippets.mongoConfig, 'mongo')}
                        className="absolute top-4 right-4 text-[10px] bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-800 hover:border-slate-600 dark:hover:border-zinc-700 px-2 py-1 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-colors"
                      >
                        {copiedCode === 'mongo' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Firebase */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 font-mono">Firebase Firestore Adapter</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed pl-4">
                      Requires local file paths pointing to Google Service Account private JSON keys. The Query Writer compiles structured queries filtering Firestore document fields.
                    </p>
                    <div className="bg-slate-900 dark:bg-zinc-950 border border-slate-800 dark:border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-zinc-300 relative overflow-x-auto">
                      <pre className="text-left whitespace-pre">{codeSnippets.firebaseConfig}</pre>
                      <button
                        onClick={() => copyToClipboard(codeSnippets.firebaseConfig, 'firebase')}
                        className="absolute top-4 right-4 text-[10px] bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-800 hover:border-slate-600 dark:hover:border-zinc-700 px-2 py-1 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-colors"
                      >
                        {copiedCode === 'firebase' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Flat File CSVs */}
                  <div className="space-y-1.5 pl-4 border-l-2 border-slate-200 dark:border-zinc-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 font-mono">Local CSV / Excel Spreadsheets</span>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Simply drag and drop local spreadsheets directly. Swarm Analyst parses records in memory using an embedded DuckDB instance, performing rapid local SQL SELECT operations on spreadsheets without requiring external server infrastructures.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* CONTRIBUTOR GUIDE TAB */}
            {activeTab === 'contribute' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-sans">Open-Source Community Contributor Guide</h3>
                  <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed">
                    Our motto is: <strong>Everyone should perform data analysis</strong>. We believe in collaborative, community-led data tools. You can easily clone, extend, and adapt Swarm Analyst.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 p-4 rounded-xl space-y-1.5">
                    <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center">1</div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Clone & Install</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                      Fork the repository, clone it locally, and run npm install to set up the workspace.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 p-4 rounded-xl space-y-1.5">
                    <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center">2</div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Add Features</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                      Extend backend database adapters in <code>backend/adapters/</code> or add agent reasoning heuristics inside <code>backend/agents/swarm.py</code>.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800 p-4 rounded-xl space-y-1.5">
                    <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center">3</div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Test & Submit</h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                      Run automated test suites to ensure everything works, and open a PR under the Apache-2.0 License guidelines.
                    </p>
                  </div>
                </div>

                {/* Local run instructions */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-medium">Cloning & Installing Dependencies</span>
                  <div className="bg-slate-900 dark:bg-zinc-950 border border-slate-800 dark:border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-zinc-300 relative overflow-x-auto">
                    <pre className="text-left whitespace-pre">{codeSnippets.installDeps}</pre>
                    <button
                      onClick={() => copyToClipboard(codeSnippets.installDeps, 'installdeps')}
                      className="absolute top-4 right-4 text-[10px] bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-800 hover:border-slate-600 dark:hover:border-zinc-700 px-2 py-1 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-colors"
                    >
                      {copiedCode === 'installdeps' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-medium">Running Local Development Environment</span>
                  <div className="bg-slate-900 dark:bg-zinc-950 border border-slate-800 dark:border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-zinc-300 relative overflow-x-auto">
                    <pre className="text-left whitespace-pre">{codeSnippets.runDev}</pre>
                    <button
                      onClick={() => copyToClipboard(codeSnippets.runDev, 'rundev')}
                      className="absolute top-4 right-4 text-[10px] bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-800 hover:border-slate-600 dark:hover:border-zinc-700 px-2 py-1 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-colors"
                    >
                      {copiedCode === 'rundev' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-medium">Running Python Tests</span>
                  <div className="bg-slate-900 dark:bg-zinc-950 border border-slate-800 dark:border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-zinc-300 relative overflow-x-auto">
                    <pre className="text-left whitespace-pre">{codeSnippets.runTests}</pre>
                    <button
                      onClick={() => copyToClipboard(codeSnippets.runTests, 'runtests')}
                      className="absolute top-4 right-4 text-[10px] bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-800 hover:border-slate-600 dark:hover:border-zinc-700 px-2 py-1 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-colors"
                    >
                      {copiedCode === 'runtests' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
