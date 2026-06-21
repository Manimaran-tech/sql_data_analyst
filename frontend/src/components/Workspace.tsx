import React, { useState, useEffect, useRef } from 'react';
import { WS_BASE_URL } from '../config';
import { SaleRecord, LogMessage, SwarmResponse, ChatMessage } from '../types';
import { Play, Sparkles, Code, AlertTriangle, Loader2, BarChart2, Save, Send, ChevronDown, ChevronUp, User, Info, Terminal } from 'lucide-react';

function renderInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let match;
  let lastIndex = 0;
  let keyCounter = 0;
  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchText = match[0];
    
    if (matchIndex > lastIndex) {
      tokens.push(text.slice(lastIndex, matchIndex));
    }
    
    if (matchText.startsWith('**') && matchText.endsWith('**')) {
      tokens.push(<strong key={`bold-${keyCounter++}`} className="font-bold">{matchText.slice(2, -2)}</strong>);
    } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
      tokens.push(<em key={`em-${keyCounter++}`} className="italic">{matchText.slice(1, -1)}</em>);
    } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
      tokens.push(<code key={`code-${keyCounter++}`} className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs">{matchText.slice(1, -1)}</code>);
    } else {
      tokens.push(matchText);
    }
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }
  
  return tokens;
}

function parseMarkdown(text: string, isUser = false): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentListItems: React.ReactNode[] = [];
  let currentListType: 'ul' | 'ol' | null = null;
  let keyCounter = 0;

  const textClass = isUser ? "text-slate-200" : "text-slate-700 dark:text-zinc-300";
  const headingClass = isUser ? "text-white font-extrabold" : "text-slate-800 dark:text-zinc-100 font-bold";

  const flushList = () => {
    if (currentListType && currentListItems.length > 0) {
      const ListTag = currentListType;
      const listClass = currentListType === 'ul' ? 'list-disc pl-5 my-1.5 space-y-1' : 'list-decimal pl-5 my-1.5 space-y-1';
      elements.push(
        <ListTag key={`list-${keyCounter++}`} className={`${listClass} ${textClass}`}>
          {currentListItems}
        </ListTag>
      );
      currentListItems = [];
      currentListType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={`h1-${keyCounter++}`} className={`text-sm mt-3.5 mb-1.5 tracking-tight ${headingClass}`}>
          {renderInline(trimmed.slice(2))}
        </h1>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${keyCounter++}`} className={`text-xs mt-3 mb-1 tracking-tight ${headingClass}`}>
          {renderInline(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${keyCounter++}`} className={`text-[11px] mt-2.5 mb-1 ${headingClass}`}>
          {renderInline(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${keyCounter++}`} className={`text-[10px] mt-2 mb-0.5 ${headingClass}`}>
          {renderInline(trimmed.slice(5))}
        </h4>
      );
    }
    // Unordered List Items
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (currentListType !== 'ul') {
        flushList();
        currentListType = 'ul';
      }
      currentListItems.push(
        <li key={`li-${keyCounter++}`} className="text-xs leading-normal">
          {renderInline(trimmed.slice(2))}
        </li>
      );
    }
    // Ordered List Items
    else if (/^\d+\.\s/.test(trimmed)) {
      if (currentListType !== 'ol') {
        flushList();
        currentListType = 'ol';
      }
      const match = trimmed.match(/^(\d+)\.\s(.*)/);
      const content = match ? match[2] : trimmed;
      currentListItems.push(
        <li key={`li-${keyCounter++}`} className="text-xs leading-normal">
          {renderInline(content)}
        </li>
      );
    }
    // Markdown table rows (starts with |)
    else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      // Collect consecutive table rows
      const tableRows: string[] = [trimmed];
      while (i + 1 < lines.length) {
        const nextTrimmed = lines[i + 1].trim();
        if (nextTrimmed.startsWith('|') && nextTrimmed.endsWith('|')) {
          tableRows.push(nextTrimmed);
          i++;
        } else {
          break;
        }
      }
      // Parse: first row = headers, skip separator row (|---|---|), rest = data
      const parsedRows = tableRows.map(r => 
        r.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim())
      );
      const headerRow = parsedRows[0] || [];
      const isSeparator = (row: string[]) => row.every(cell => /^[-:]+$/.test(cell));
      const dataRows = parsedRows.slice(1).filter(row => !isSeparator(row));

      elements.push(
        <div key={`table-${keyCounter++}`} className="my-2 overflow-x-auto rounded-sm border border-slate-200 dark:border-zinc-800">
          <table className="min-w-full text-[10px] font-mono">
            <thead className="bg-slate-50 dark:bg-zinc-950">
              <tr>
                {headerRow.map((cell, ci) => (
                  <th key={ci} className="px-3 py-1.5 text-left font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {dataRows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-1.5 text-slate-700 dark:text-zinc-300">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    // Empty Line
    else if (trimmed === '') {
      flushList();
      elements.push(<div key={`br-${keyCounter++}`} className="h-1.5" />);
    }
    // Regular text paragraph
    else {
      flushList();
      elements.push(
        <p key={`p-${keyCounter++}`} className={`text-xs leading-normal ${textClass}`}>
          {renderInline(line)}
        </p>
      );
    }
  }

  flushList();
  return <div className="space-y-1 font-sans">{elements}</div>;
}

interface WorkspaceProps {
  dataset: SaleRecord[];
  activeModel: string;
  llmProvider: string;
  apiBaseUrl: string;
  selectedDbType: 'postgres' | 'mongodb' | 'firebase' | 'flatfile';
  postgresCreds: any;
  mongoCreds: any;
  firebaseCreds: any;
  uploadedFiles: any[];
  onInvestigationSuccess: () => void;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  latestDashboardUrl: string | null;
  setLatestDashboardUrl: (url: string | null) => void;
  latestSwarmResult: SwarmResponse | null;
  setLatestSwarmResult: (res: SwarmResponse | null) => void;
  setActiveView: (view: 'workspace' | 'dashboard' | 'setup' | 'settings') => void;
}

export default function Workspace({
  dataset,
  activeModel,
  llmProvider,
  apiBaseUrl,
  selectedDbType,
  postgresCreds,
  mongoCreds,
  firebaseCreds,
  uploadedFiles,
  onInvestigationSuccess,
  chatHistory,
  setChatHistory,
  latestDashboardUrl,
  setLatestDashboardUrl,
  latestSwarmResult,
  setLatestSwarmResult,
  setActiveView
}: WorkspaceProps) {
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<LogMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Track open/collapsed states of logs and queries for individual messages
  const [expandedLogs, setExpandedLogs] = useState<{ [msgId: string]: boolean }>({});
  const [expandedQueries, setExpandedQueries] = useState<{ [msgId: string]: boolean }>({});
  const [showActiveLogs, setShowActiveLogs] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Auto-scroll logs and chat container to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, executionLogs, isExecuting]);

  const toggleLogs = (msgId: string) => {
    setExpandedLogs(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const toggleQueries = (msgId: string) => {
    setExpandedQueries(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Launch AI Swarm execution via real backend WebSockets
  const handleLaunchSwarm = (queryText: string) => {
    const trimmedQuery = queryText.trim();
    if (!trimmedQuery || isExecuting) return;

    // 1. Add user message to chat history immediately
    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      sender: 'user',
      text: trimmedQuery,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setQuery('');
    setIsExecuting(true);
    setErrorMessage(null);
    setExecutionLogs([]);

    // Build credentials payload for backend adapters
    let credentials: any = {};
    if (selectedDbType === 'postgres') credentials = postgresCreds;
    else if (selectedDbType === 'mongodb') credentials = mongoCreds;
    else if (selectedDbType === 'firebase') credentials = firebaseCreds;
    else if (selectedDbType === 'flatfile') {
      const filesMap: Record<string, string> = {};
      uploadedFiles.forEach(f => {
        filesMap[f.table_name] = f.file_path;
      });
      credentials = { files: filesMap };
    }

    // Connect to backend WebSocket
    const ws = new WebSocket(WS_BASE_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      // Package query and pass the existing chat history so the backend agent remembers context!
      ws.send(JSON.stringify({
        api_key: '', // backend retrieves it securely from OS keyring
        db_type: selectedDbType,
        credentials,
        question: trimmedQuery,
        model: activeModel,
        llm_provider: llmProvider,
        api_base_url: apiBaseUrl,
        chat_history: chatHistory.map(h => ({
          sender: h.sender,
          text: h.text
        }))
      }));
    };

    ws.onmessage = (event) => {
      const packet = JSON.parse(event.data);

      if (packet.type === 'log') {
        const agent = packet.agent;
        const text = packet.message;
        let sender: 'SYSTEM' | 'SCHEMA ANALYST AGENT' | 'DATA COGNITIVE AGENT' | 'EXECUTIVE INSIGHT AGENT' = 'SYSTEM';
        
        const name = agent.toLowerCase();
        if (name.includes('system')) sender = 'SYSTEM';
        else if (name.includes('schema')) sender = 'SCHEMA ANALYST AGENT';
        else if (name.includes('writer') || name.includes('execution') || name.includes('qa')) sender = 'DATA COGNITIVE AGENT';
        else if (name.includes('coordinator')) sender = 'EXECUTIVE INSIGHT AGENT';

        const status = text.includes('failed') || text.includes('Error') ? 'info' as const : 
                      text.includes('succeeded') || text.includes('Approved') || text.includes('success') ? 'success' as const : 'working' as const;

        setExecutionLogs(prev => [
          ...prev.map(l => l.status === 'working' ? { ...l, status: 'success' as const } : l),
          {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString(),
            sender,
            text,
            status
          }
        ]);
      } else if (packet.type === 'result') {
        const sqlString = (packet.history || []).map((h: any, idx: number) => `Sub-task ${idx+1}: ${h.sub_task}\nSQL/Pipeline:\n${h.query}\n\nResults:\n${h.result}`).join('\n\n');
        
        const assistantMsg: ChatMessage = {
          id: `${Date.now()}-assistant`,
          sender: 'assistant',
          text: packet.report,
          timestamp: new Date().toLocaleTimeString(),
          logs: [...executionLogs],
          sqlOrQueryDetails: sqlString,
          visualization: packet.visualization ? {
            type: packet.visualization.chart_type || 'bar',
            title: packet.visualization.title || 'Data Metrics Overview',
            xAxisKey: packet.visualization.x_axis || '',
            yAxisKey: packet.visualization.y_axis || '',
            data: packet.visualization.data || []
          } : undefined,
          dashboardUrl: packet.dashboard_url || undefined
        };

        // Update states
        setChatHistory(prev => [...prev, assistantMsg]);
        setLatestDashboardUrl(packet.dashboard_url || null);
        
        setLatestSwarmResult({
          answer: packet.report,
          chartData: packet.visualization?.data || [],
          chartConfig: {
            type: packet.visualization?.chart_type || 'bar',
            title: packet.visualization?.title || 'Data Metrics Overview',
            xAxisKey: packet.visualization?.x_axis || '',
            yAxisKey: packet.visualization?.y_axis || ''
          },
          sqlOrQueryDetails: sqlString,
          logs: []
        });

        setIsExecuting(false);
        onInvestigationSuccess();
        ws.close();
      } else if (packet.type === 'error') {
        setErrorMessage(packet.message);
        setIsExecuting(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      setErrorMessage(`WebSocket connection error. Make sure FastAPI server is running on ${WS_BASE_URL}.`);
      setIsExecuting(false);
    };

    ws.onclose = () => {
      setIsExecuting(false);
    };
  };

  const handleSaveReport = (reportText: string) => {
    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'swarm_analytical_report.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveQueries = (queriesText: string) => {
    const blob = new Blob([queriesText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'swarm_execution_queries.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const quickStartPrompts = [
    {
      title: "Pricing Strategy",
      text: "Compare average discount rates across regions to identify potential pricing strategy inconsistencies"
    },
    {
      title: "June Sales Drop",
      text: "Why did sales drop in June month?"
    },
    {
      title: "Regional Share",
      text: "Show category sales by region"
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm shadow-sm overflow-hidden">
      {/* Scrollable Conversation Stream */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-zinc-950/50"
      >
        {chatHistory.length === 0 && !isExecuting && (
          <div className="max-w-xl mx-auto text-center py-12 space-y-6">
            <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950/45 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
              <Terminal className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-tight">AI Data Analyst Swarm Workspace</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-xs leading-normal">
                Ask natural language questions about your connected database tables. The coordinator agent will outline hypotheses, generate database queries, review outputs, and build professional analytical summaries.
              </p>
            </div>

            {/* Quick start tags */}
            <div className="pt-4 space-y-3">
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 tracking-wider">Suggested Enquiries</p>
              <div className="flex flex-col gap-2">
                {quickStartPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(p.text)}
                    className="p-3 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 rounded-sm text-left text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm cursor-pointer"
                  >
                    <span className="font-bold text-blue-600 dark:text-blue-400 mr-2 text-[10px] uppercase font-mono bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/55 px-1 py-0.5 rounded-sm">
                      {p.title}
                    </span>
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div 
            key={msg.id}
            className={`flex gap-4 max-w-4xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            {/* Avatar indicator */}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${
              msg.sender === 'user' 
                ? 'bg-slate-800 dark:bg-zinc-800 text-white border-slate-900 dark:border-zinc-700' 
                : 'bg-blue-600 text-white border-blue-700'
            }`}>
              {msg.sender === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <span className="text-[10px] font-extrabold tracking-tight font-sans text-white">SA</span>
              )}
            </div>

            {/* Speech Bubble body */}
            <div className={`flex flex-col space-y-2.5 max-w-[calc(100%-3rem)]`}>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  {msg.sender === 'user' ? 'Client Request' : 'Swarm Coordinator'}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div className={`p-4 rounded-sm border shadow-sm text-xs leading-relaxed select-text ${
                msg.sender === 'user'
                  ? 'bg-slate-800 dark:bg-zinc-800 text-slate-100 dark:text-zinc-200 border-slate-900 dark:border-zinc-700'
                  : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-800'
              }`}>
                {/* Text Content */}
                <div className="font-sans">
                  {parseMarkdown(msg.text, msg.sender === 'user')}
                </div>

                {/* Assistant additional attachments */}
                {msg.sender === 'assistant' && (
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                    {/* Collapsible Swarm thoughts */}
                    {msg.logs && msg.logs.length > 0 && (
                      <div className="space-y-1.5">
                        <button
                          onClick={() => toggleLogs(msg.id)}
                          className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 font-mono hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          {expandedLogs[msg.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          Swarm Agent Reasoning Logs ({msg.logs.length} entries)
                        </button>
                        {expandedLogs[msg.id] && (
                          <div className="bg-[#090d16] text-slate-200 rounded-sm p-3 font-mono text-[9px] max-h-48 overflow-y-auto space-y-2 border border-slate-950 shadow-inner">
                            {msg.logs.map((log) => (
                              <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                                <span className="text-slate-500 text-[8px] select-none whitespace-nowrap">{log.timestamp}</span>
                                <span className={`px-1 rounded text-[8px] font-extrabold tracking-wide uppercase select-none ${
                                  log.sender === 'SYSTEM'
                                    ? 'bg-slate-800 text-slate-300'
                                    : log.sender === 'SCHEMA ANALYST AGENT'
                                    ? 'bg-blue-950 text-blue-300'
                                    : log.sender === 'DATA COGNITIVE AGENT'
                                    ? 'bg-emerald-950 text-emerald-300'
                                    : 'bg-indigo-950 text-indigo-300'
                                }`}>
                                  {log.sender}
                                </span>
                                <span className={log.status === 'info' ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                                  {log.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Collapsible SQL Query Details */}
                    {msg.sqlOrQueryDetails && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => toggleQueries(msg.id)}
                            className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 font-mono hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            {expandedQueries[msg.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            SQL Database Execution Logic
                          </button>
                          {expandedQueries[msg.id] && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveQueries(msg.sqlOrQueryDetails!)}
                                className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-[8px] uppercase font-bold tracking-wider rounded border border-slate-200 dark:border-zinc-700 cursor-pointer"
                              >
                                Save SQL
                              </button>
                              <button
                                onClick={() => handleSaveReport(msg.text)}
                                className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-[8px] uppercase font-bold tracking-wider rounded border border-slate-200 dark:border-zinc-700 cursor-pointer"
                              >
                                Save Report
                              </button>
                            </div>
                          )}
                        </div>
                        {expandedQueries[msg.id] && (
                          <pre className="bg-slate-50 dark:bg-zinc-950/60 text-slate-600 dark:text-zinc-300 font-mono text-[9px] p-2.5 rounded border border-slate-200 dark:border-zinc-800 overflow-x-auto select-all max-h-40 overflow-y-auto leading-normal">
                            {msg.sqlOrQueryDetails}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* Visual Navigation popup/banner */}
                    {msg.visualization && (
                      <div className="mt-3.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-sm p-3.5 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-2.5">
                          <BarChart2 className="h-4 w-4 text-blue-600 animate-pulse" />
                          <span className="font-medium">Visualizations & dashboards generated! Check them out in detail.</span>
                        </div>
                        <button
                          onClick={() => {
                            setLatestDashboardUrl(msg.dashboardUrl || null);
                            setLatestSwarmResult({
                              answer: msg.text,
                              chartData: msg.visualization?.data || [],
                              chartConfig: {
                                type: (msg.visualization?.type || 'bar') as any,
                                title: msg.visualization?.title || 'Data Metrics Overview',
                                xAxisKey: msg.visualization?.xAxisKey || '',
                                yAxisKey: msg.visualization?.yAxisKey || ''
                              },
                              sqlOrQueryDetails: msg.sqlOrQueryDetails || '',
                              logs: []
                            });
                            setActiveView('dashboard');
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-sm cursor-pointer shadow-sm transition-colors border border-blue-700"
                        >
                          Go to Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Real-time processing feedback logs */}
        {isExecuting && (
          <div className="flex gap-4 max-w-4xl mr-auto">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse border border-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="flex-1 flex flex-col space-y-2.5 max-w-[calc(100%-3rem)]">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span className="font-bold uppercase tracking-wider text-slate-500">Agent Swarm Active</span>
                <span>•</span>
                <span className="animate-pulse">Thinking...</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-mono">Streaming swarm activity logs...</span>
                  <button 
                    onClick={() => setShowActiveLogs(!showActiveLogs)}
                    className="text-[9px] text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 font-mono flex items-center gap-0.5 cursor-pointer"
                  >
                    {showActiveLogs ? 'Hide Logs' : 'Show Logs'}
                  </button>
                </div>

                {showActiveLogs && executionLogs.length > 0 && (
                  <div className="bg-[#090d16] text-slate-200 rounded-sm p-3.5 font-mono text-[9px] leading-normal max-h-48 overflow-y-auto space-y-1.5 border border-slate-950 shadow-inner">
                    {executionLogs.map((log) => (
                      <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                        <span className="text-slate-500 text-[8px] select-none whitespace-nowrap">{log.timestamp}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase select-none ${
                          log.sender === 'SYSTEM'
                            ? 'bg-slate-800 text-slate-300'
                            : log.sender === 'SCHEMA ANALYST AGENT'
                            ? 'bg-blue-950 text-blue-300'
                            : log.sender === 'DATA COGNITIVE AGENT'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-indigo-950 text-indigo-300'
                        }`}>
                          {log.sender}
                        </span>
                        <span className={log.status === 'info' ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                          {log.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="max-w-4xl mx-auto bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-sm p-4 flex gap-3 text-rose-800 dark:text-rose-300 shadow-sm">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] font-sans space-y-0.5">
              <h4 className="font-bold text-rose-900 uppercase tracking-tight">Swarm Execution Failure</h4>
              <p className="leading-relaxed text-rose-700 dark:text-rose-400">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Query Input Area */}
      <div className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <div className="flex-1 flex flex-col gap-1">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleLaunchSwarm(query);
                }
              }}
              disabled={isExecuting}
              placeholder="Ask an analytical query (e.g., Which categories have the highest discount rate?)..."
              rows={2}
              className="w-full bg-slate-50/60 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 rounded-sm p-3.5 text-xs text-slate-700 dark:text-zinc-200 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-sans leading-relaxed resize-none"
            />
          </div>
          <button
            onClick={() => handleLaunchSwarm(query)}
            disabled={isExecuting || !query.trim()}
            className="h-10 px-5 rounded bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:bg-slate-200 dark:disabled:bg-zinc-800/80 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm border border-blue-700 flex-shrink-0"
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-3.5 w-3.5 fill-current" />
                SEND
              </>
            )}
          </button>
        </div>
        <div className="max-w-4xl mx-auto mt-2 flex justify-between items-center text-[10px] text-slate-400 dark:text-zinc-500 font-sans">
          <span>
            Connected to <strong className="font-semibold text-slate-600 dark:text-zinc-300">{selectedDbType.toUpperCase()}</strong>. 
            Dataset records: <strong className="font-semibold text-slate-600 dark:text-zinc-300">{dataset.length}</strong>.
          </span>
          <span className="font-mono text-slate-400 dark:text-zinc-500">
            Shift + Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}
