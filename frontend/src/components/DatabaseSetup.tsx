import React, { useState, useRef } from 'react';
import { API_BASE_URL } from '../config';
import { SaleRecord } from '../types';
import { parseCSV } from '../utils';
import { Database, FileText, Upload, CheckCircle2, AlertTriangle, Loader2, Search, Table, Trash2 } from 'lucide-react';

interface DatabaseSetupProps {
  dataset: any[];
  onDatasetUpdate: (newData: any[], name: string) => void;
  fileName: string;
  selectedDbType: 'postgres' | 'mongodb' | 'firebase' | 'flatfile';
  setSelectedDbType: (dbType: 'postgres' | 'mongodb' | 'firebase' | 'flatfile') => void;
  postgresCreds: any;
  setPostgresCreds: (creds: any) => void;
  mongoCreds: any;
  setMongoCreds: (creds: any) => void;
  firebaseCreds: any;
  setFirebaseCreds: (creds: any) => void;
  uploadedFiles: any[];
  setUploadedFiles: (files: any[]) => void;
  user?: any;
}

export default function DatabaseSetup({
  dataset,
  onDatasetUpdate,
  fileName,
  selectedDbType,
  setSelectedDbType,
  postgresCreds,
  setPostgresCreds,
  mongoCreds,
  setMongoCreds,
  firebaseCreds,
  setFirebaseCreds,
  uploadedFiles,
  setUploadedFiles,
  user
}: DatabaseSetupProps) {
  const [testConnectStatus, setTestConnectStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testConnectError, setTestConnectError] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [schemaReflected, setSchemaReflected] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload custom CSV file to backend
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setTestConnectStatus('idle');
    setTestConnectError('');

    const userId = user?.uid || localStorage.getItem('swarm_session_id') || 'default';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadedFiles([{
          table_name: data.table_name,
          file_path: data.file_path,
          original_filename: data.original_filename
        }]);

        // Parse in frontend to update local charts/Recharts
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (text) {
            const records = parseCSV(text);
            if (records.length > 0) {
              onDatasetUpdate(records, file.name);
              setTestConnectStatus('success');

              const cols = Object.keys(records[0] || {});
              const colLines = cols.map(col => {
                const sampleVal = records[0][col];
                const typeStr = typeof sampleVal === 'number' ? 'DOUBLE' : 'VARCHAR';
                return `  ${col.padEnd(16)} ${typeStr.padEnd(12)} (nullable)`;
              }).join('\n');

              setSchemaReflected(`DATABASE SCHEMA - Local Dataset Tables (CSV/Excel)
==================================================

📊 ${data.table_name} (${records.length} rows)
--------------------------------------------------
${colLines}`);
            } else {
              alert('Could not parse any valid row records in target file. Standard CSV configuration expected.');
            }
          }
        };
        reader.readAsText(file);
      } else {
        setTestConnectStatus('error');
        setTestConnectError(data.detail || 'File upload failed.');
      }
    } catch (err: any) {
      console.error(err);
      setTestConnectStatus('error');
      setTestConnectError(err.message || 'Error uploading file to sidecar.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleClearUploadedFile = () => {
    onDatasetUpdate([], '');
    setUploadedFiles([]);
    setTestConnectStatus('idle');
    setSchemaReflected('');
  };

  // Test database connection settings
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestConnectStatus('idle');
    setTestConnectError('');

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

    try {
      const res = await fetch(`${API_BASE_URL}/api/connect-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_type: selectedDbType, credentials })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestConnectStatus('success');
        setSchemaReflected(data.schema || '');
        if (data.preview_records && data.preview_records.length > 0) {
          onDatasetUpdate(data.preview_records, data.preview_table_name || 'database_table');
        } else {
          onDatasetUpdate([], data.preview_table_name || 'database_table');
        }
      } else {
        setTestConnectStatus('error');
        setTestConnectError(data.detail || 'Connection test failed.');
      }
    } catch (err: any) {
      setTestConnectStatus('error');
      setTestConnectError(err.message || 'Error communicating with server.');
    } finally {
      setIsTesting(false);
    }
  };

  // Get columns dynamically from the first record in the dataset
  const tableColumns = React.useMemo(() => {
    if (dataset.length === 0) return [];
    return Object.keys(dataset[0]);
  }, [dataset]);

  // Filter preview records
  const filteredRecords = dataset.filter(r => {
    if (!tableSearch) return true;
    const search = tableSearch.toLowerCase();
    return Object.values(r).some(val => 
      String(val).toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-5">
      {/* Selection Cards matching user's Configure Local Data Source Screen */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-tight text-slate-800 dark:text-zinc-200 mb-3">Configure Local Data Source</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Option: PostgreSQL */}
          <button
            onClick={() => { setSelectedDbType('postgres'); setTestConnectStatus('idle'); }}
            className={`flex flex-col items-center justify-center p-4 rounded-sm border text-center transition-all ${
              selectedDbType === 'postgres'
                ? 'border-blue-600 bg-blue-50/30 text-blue-700 font-bold shadow-inner'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-500 dark:text-zinc-400'
            }`}
          >
            <Database className="h-5 w-5 mb-2 text-blue-600" />
            <span className="text-[11px] font-bold uppercase tracking-tight">PostgreSQL</span>
          </button>

          {/* Option: MongoDB */}
          <button
            onClick={() => { setSelectedDbType('mongodb'); setTestConnectStatus('idle'); }}
            className={`flex flex-col items-center justify-center p-4 rounded-sm border text-center transition-all ${
              selectedDbType === 'mongodb'
                ? 'border-blue-600 bg-blue-50/30 text-blue-700 font-bold shadow-inner'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-500 dark:text-zinc-400'
            }`}
          >
            <Database className="h-5 w-5 mb-2 text-blue-600" />
            <span className="text-[11px] font-bold uppercase tracking-tight">MongoDB</span>
          </button>

          {/* Option: Firebase Firestore */}
          <button
            onClick={() => { setSelectedDbType('firebase'); setTestConnectStatus('idle'); }}
            className={`flex flex-col items-center justify-center p-4 rounded-sm border text-center transition-all ${
              selectedDbType === 'firebase'
                ? 'border-blue-600 bg-blue-50/30 text-blue-700 font-bold shadow-inner'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-500 dark:text-zinc-400'
            }`}
          >
            <Database className="h-5 w-5 mb-2 text-blue-600" />
            <span className="text-[11px] font-bold uppercase tracking-tight">Cloud Firestore</span>
          </button>

          {/* Option: Excel / CSV (Active) */}
          <button
            onClick={() => { setSelectedDbType('flatfile'); setTestConnectStatus('idle'); }}
            className={`flex flex-col items-center justify-center p-4 rounded-sm border text-center transition-all ${
              selectedDbType === 'flatfile'
                ? 'border-blue-600 bg-blue-50/30 text-blue-700 font-bold shadow-inner'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-500 dark:text-zinc-400'
            }`}
          >
            <FileText className="h-5 w-5 mb-2 text-blue-600" />
            <span className="text-[11px] font-bold uppercase tracking-tight">Excel / CSV Flatfile</span>
          </button>
        </div>
      </div>

      {/* POSTGRES CONNECTION FORM */}
      {selectedDbType === 'postgres' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm space-y-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
            PostgreSQL Connection Parameters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Host</label>
              <input
                type="text"
                value={postgresCreds.host}
                onChange={(e) => setPostgresCreds({ ...postgresCreds, host: e.target.value })}
                className="w-full bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm p-2 text-[11px] text-slate-700 dark:text-zinc-200 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Port</label>
              <input
                type="text"
                value={postgresCreds.port}
                onChange={(e) => setPostgresCreds({ ...postgresCreds, port: e.target.value })}
                className="w-full bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm p-2 text-[11px] text-slate-700 dark:text-zinc-200 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Username</label>
              <input
                type="text"
                value={postgresCreds.user}
                onChange={(e) => setPostgresCreds({ ...postgresCreds, user: e.target.value })}
                className="w-full bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm p-2 text-[11px] text-slate-700 dark:text-zinc-200 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Password</label>
              <input
                type="password"
                value={postgresCreds.password}
                onChange={(e) => setPostgresCreds({ ...postgresCreds, password: e.target.value })}
                className="w-full bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm p-2 text-[11px] text-slate-700 dark:text-zinc-200 outline-none transition-all"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Database Name</label>
              <input
                type="text"
                value={postgresCreds.database}
                onChange={(e) => setPostgresCreds({ ...postgresCreds, database: e.target.value })}
                className="w-full bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm p-2 text-[11px] text-slate-700 dark:text-zinc-200 outline-none transition-all"
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-1.5 hover:bg-blue-700 dark:hover:bg-blue-500 cursor-pointer bg-blue-600 dark:bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-sm shadow-sm transition-all flex items-center gap-1.5"
            >
              {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {isTesting ? 'CONNECTING...' : 'TEST AND CONNECT SOURCE'}
            </button>
          </div>
        </div>
      )}

      {/* MONGODB CONNECTION FORM */}
      {selectedDbType === 'mongodb' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm space-y-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
            MongoDB Connection Parameters
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Connection URI</label>
              <input
                type="text"
                value={mongoCreds.uri}
                onChange={(e) => setMongoCreds({ ...mongoCreds, uri: e.target.value })}
                className="w-full bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm p-2 text-[11px] text-slate-700 dark:text-zinc-200 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Database Name</label>
              <input
                type="text"
                value={mongoCreds.database}
                onChange={(e) => setMongoCreds({ ...mongoCreds, database: e.target.value })}
                className="w-full bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm p-2 text-[11px] text-slate-700 dark:text-zinc-200 outline-none transition-all"
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-1.5 hover:bg-blue-700 dark:hover:bg-blue-500 cursor-pointer bg-blue-600 dark:bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-sm shadow-sm transition-all flex items-center gap-1.5"
            >
              {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {isTesting ? 'CONNECTING...' : 'TEST AND CONNECT SOURCE'}
            </button>
          </div>
        </div>
      )}

      {/* CLOUD FIRESTORE CONNECTION FORM */}
      {selectedDbType === 'firebase' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm space-y-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
            Firebase Firestore Parameters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Service Account JSON File Path</label>
              <input
                type="text"
                value={firebaseCreds.service_account_path}
                onChange={(e) => setFirebaseCreds({ ...firebaseCreds, service_account_path: e.target.value })}
                placeholder="e.g. C:/keys/firebase-adminsdk.json"
                className="w-full bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm p-2 text-[11px] text-slate-700 dark:text-zinc-200 outline-none transition-all"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Project ID</label>
              <input
                type="text"
                value={firebaseCreds.project_id}
                onChange={(e) => setFirebaseCreds({ ...firebaseCreds, project_id: e.target.value })}
                className="w-full bg-slate-50/60 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm p-2 text-[11px] text-slate-700 dark:text-zinc-200 outline-none transition-all"
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-1.5 hover:bg-blue-700 dark:hover:bg-blue-500 cursor-pointer bg-blue-600 dark:bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-sm shadow-sm transition-all flex items-center gap-1.5"
            >
              {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {isTesting ? 'CONNECTING...' : 'TEST AND CONNECT SOURCE'}
            </button>
          </div>
        </div>
      )}

      {/* CSV FLAT FILE UPLOADER */}
      {selectedDbType === 'flatfile' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm space-y-3.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
            Dataset File Uploads (Excel / CSV)
          </div>

          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={handleSelectFileClick}
            className={`border-2 border-dashed rounded-sm p-6 py-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950/20 hover:bg-slate-50 dark:hover:bg-zinc-900/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="h-10 w-10 bg-white dark:bg-zinc-950 rounded-sm shadow-sm flex items-center justify-center border border-slate-200 dark:border-zinc-800 text-slate-500 mb-3">
              {isUploading ? (
                <Loader2 className="h-4.5 w-4.5 text-blue-600 animate-spin" />
              ) : (
                <Upload className="h-4.5 w-4.5 text-blue-600" />
              )}
            </div>
            <p className="text-[11px] font-bold text-slate-700 leading-snug">
              {isUploading ? 'Uploading file to sidecar server...' : 'Click to select or drag and drop CSV dataset'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
              Files will be parsed into local DuckDB cache and memory previews
            </p>
          </div>

          {/* Registered Tables List */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 font-mono mb-2">
              Registered Tables:
            </div>
            <div className="flex items-center justify-between p-3 rounded-sm border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/45">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                <div>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-200">
                    {uploadedFiles.length > 0 ? uploadedFiles[0].table_name : 'sample_sales_db'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans ml-2">
                    ({fileName || 'sample_sales.csv'})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 tracking-wider font-mono">
                  ACTIVE_INST
                </span>
                {uploadedFiles.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearUploadedFile();
                    }}
                    className="p-1 rounded-sm text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                    title="Remove custom dataset"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Result / Schema Preview logs */}
      {testConnectStatus === 'success' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm space-y-3.5 transition-colors duration-200">
          <div className="flex items-start gap-2 text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/20 p-3 border border-emerald-100 dark:border-emerald-900/30 rounded-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] font-sans space-y-0.5">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-200">Connected successfully!</h4>
              <p className="text-emerald-700/90 dark:text-emerald-300/90 leading-normal">Database source registered and verified. Ready to initiate Swarm analysis.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
              Reflected Schema Definition:
            </div>
            <pre className="bg-[#121824] text-emerald-400 font-mono text-[10px] leading-relaxed p-4 rounded-sm border border-slate-900 overflow-x-auto select-all shadow-inner">
              {schemaReflected}
            </pre>
          </div>
        </div>
      )}

      {testConnectStatus === 'error' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm space-y-3.5 transition-colors duration-200">
          <div className="flex items-start gap-2 text-rose-800 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/20 p-3 border border-rose-100 dark:border-rose-900/30 rounded-sm">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] font-sans space-y-0.5">
              <h4 className="font-bold text-rose-900 dark:text-rose-200">Connection Failed</h4>
              <p className="text-rose-700/95 dark:text-rose-300/95 leading-normal">{testConnectError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid records browser - Data sheet preview */}
      {dataset.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm space-y-3.5 text-slate-800 dark:text-zinc-200 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Table className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight">Live Data Sheet Browser</h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans">Browse database record tables directly inside memory workspace.</p>
              </div>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search rows..."
                className="pl-7 pr-3 py-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-200 rounded-sm outline-none w-48 font-sans focus:border-blue-500 dark:focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-72 border border-slate-200 dark:border-zinc-800 rounded-sm select-text">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-zinc-800 text-left font-sans text-[11px]">
              <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 font-mono text-[9px] uppercase font-bold sticky top-0 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  {tableColumns.map((col) => (
                    <th key={col} className="px-3 py-2 whitespace-nowrap">
                      {col.replace(/_/g, ' ').toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {filteredRecords.slice(0, 50).map((row, index) => (
                  <tr key={index} className="bg-white dark:bg-zinc-900 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    {tableColumns.map((col) => {
                      const val = row[col];
                      let displayVal = '';
                      if (val === null || val === undefined) {
                        displayVal = 'NULL';
                      } else if (typeof val === 'object') {
                        displayVal = JSON.stringify(val);
                      } else if (typeof val === 'number') {
                        if (col.includes('price') || col.includes('amount') || col.includes('revenue') || col.includes('sales')) {
                          displayVal = `$${val.toFixed(2)}`;
                        } else if (col.includes('discount') || col.includes('rate')) {
                          // Handle discount formatted as percentage vs fraction
                          displayVal = val <= 1.0 ? `${(val * 100).toFixed(0)}%` : `${val}%`;
                        } else {
                          displayVal = String(val);
                        }
                      } else {
                        displayVal = String(val);
                      }
                      return (
                        <td key={col} className="px-3 py-1.5 truncate max-w-[200px] text-slate-700 dark:text-zinc-300" title={displayVal}>
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={tableColumns.length || 1} className="px-4 py-8 text-center text-slate-400 dark:text-zinc-500 font-mono">
                      No records match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredRecords.length > 0 && (
            <div className="text-[9px] text-slate-500 dark:text-zinc-500 font-mono text-right">
              Displaying first {Math.min(50, filteredRecords.length)} rows of {filteredRecords.length} records.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
