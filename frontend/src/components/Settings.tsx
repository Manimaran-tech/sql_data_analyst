import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Settings as SettingsIcon, ShieldCheck, Cpu, Sliders, Zap, Lock, Globe } from 'lucide-react';

interface SettingsProps {
  activeModel: string;
  setActiveModel: (model: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  pacing: 'instant' | 'normal' | 'fast';
  setPacing: (pacing: 'instant' | 'normal' | 'fast') => void;
  llmProvider: string;
  setLlmProvider: (provider: string) => void;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
}

// Provider definitions with their default models
const LLM_PROVIDERS = [
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    badge: 'DEFAULT',
    badgeColor: 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40',
    description: 'NVIDIA Inference Microservices — optimized Llama and Nemotron models with enterprise-grade inference.',
    keyPlaceholder: 'nvapi-...',
    models: [
      { id: 'nvidia/llama-3.3-nemotron-super-49b-v1', name: 'nemotron-super-49b', badge: 'RECOMMENDED', badgeColor: 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40', description: 'Active Nemotron-powered model. Superior business logic with high-speed query synthesis.' },
      { id: 'meta/llama-3.3-70b-instruct', name: 'llama-3.3-70b', badge: 'PRO_POWER', badgeColor: 'bg-blue-50 dark:bg-blue-950/25 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40', description: 'Maximizes cognitive capability and reasoning depth on larger datasets.' },
      { id: 'nvidia/llama-3.1-nemotron-nano-8b-v1', name: 'nemotron-nano-8b', badge: 'LIGHTWEIGHT', badgeColor: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800', description: 'Sub-second response processing. Fast reasoning and low credit consumption.' },
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'POPULAR',
    badgeColor: 'bg-blue-50 dark:bg-blue-950/25 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40',
    description: 'GPT-4o, GPT-4.1, and o-series reasoning models from OpenAI.',
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', badge: 'RECOMMENDED', badgeColor: 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40', description: 'Best balance of speed, intelligence, and cost. Ideal for data analysis tasks.' },
      { id: 'gpt-4.1', name: 'GPT-4.1', badge: 'LATEST', badgeColor: 'bg-violet-50 dark:bg-violet-950/25 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/40', description: 'Latest generation model with improved instruction following and coding.' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: 'LIGHTWEIGHT', badgeColor: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800', description: 'Cost-efficient mini model for simpler analytical queries.' },
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    badge: 'ADVANCED',
    badgeColor: 'bg-amber-50 dark:bg-amber-950/25 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
    description: 'Claude 4 and Claude 3.5 models — strong reasoning and nuanced analysis.',
    keyPlaceholder: 'sk-ant-api...',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', badge: 'RECOMMENDED', badgeColor: 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40', description: 'Latest Claude model. Exceptional analytical reasoning and structured output.' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', badge: 'PROVEN', badgeColor: 'bg-blue-50 dark:bg-blue-950/25 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40', description: 'Battle-tested Sonnet model with strong SQL generation capabilities.' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', badge: 'LIGHTWEIGHT', badgeColor: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800', description: 'Fastest Claude model. Great for high-throughput analytical pipelines.' },
    ]
  },
  {
    id: 'groq',
    name: 'Groq',
    badge: 'ULTRA-FAST',
    badgeColor: 'bg-rose-50 dark:bg-rose-950/25 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40',
    description: 'LPU-powered inference — blazing fast Llama and Mixtral models.',
    keyPlaceholder: 'gsk_...',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', badge: 'RECOMMENDED', badgeColor: 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40', description: 'Most capable Groq model. Strong SQL reasoning at lightning speed.' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', badge: 'INSTANT', badgeColor: 'bg-rose-50 dark:bg-rose-950/25 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40', description: 'Near-instant responses. Great for rapid iteration and prototyping.' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', badge: 'MoE', badgeColor: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800', description: 'Mixture-of-Experts architecture. 32K context window for complex analysis.' },
    ]
  },
];

export default function Settings({
  activeModel,
  setActiveModel,
  temperature,
  setTemperature,
  pacing,
  setPacing,
  llmProvider,
  setLlmProvider,
  apiBaseUrl,
  setApiBaseUrl
}: SettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(0);

  const currentProvider = LLM_PROVIDERS.find(p => p.id === llmProvider) || LLM_PROVIDERS[0];
  const providerModels = currentProvider.models;

  const [isCustomMode, setIsCustomMode] = useState(() => {
    return !providerModels.some(m => m.id === activeModel);
  });
  const [customModelId, setCustomModelId] = useState(isCustomMode ? activeModel : '');

  const loadKeyStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/key`);
      const data = await res.json();
      if (data.has_key) {
        setHasKey(true);
        setExpiresInHours(data.expires_in_hours);
      } else {
        setHasKey(false);
        setExpiresInHours(0);
      }
    } catch (err) {
      console.error('Failed to load key:', err);
    }
  };

  // Load API Key status from OS Keyring on mount
  useEffect(() => {
    loadKeyStatus();
  }, []);

  // When provider changes, update the selected model to that provider's default
  useEffect(() => {
    const provider = LLM_PROVIDERS.find(p => p.id === llmProvider);
    if (provider) {
      const isModelInProvider = provider.models.some(m => m.id === activeModel);
      if (!isModelInProvider && !isCustomMode) {
        setActiveModel(provider.models[0].id);
      }
    }
  }, [llmProvider]);

  const handleSaveApiKey = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`${currentProvider.name} API Key securely saved in your OS Keyring!`);
        setApiKey('');
        loadKeyStatus();
      } else {
        alert(data.detail || 'Failed to save API Key.');
      }
    } catch (err: any) {
      alert('Error saving API Key: ' + err.message);
    }
  };

  const handleClearApiKey = async () => {
    if (!confirm('Are you sure you want to delete your API Key from the OS Keyring?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/key`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApiKey('');
        setHasKey(false);
        setExpiresInHours(0);
        alert('API Key removed from OS Keyring.');
      } else {
        alert(data.detail || 'Failed to remove API Key.');
      }
    } catch (err: any) {
      alert('Error clearing API Key: ' + err.message);
    }
  };

  const handleModelSelect = (model: string) => {
    setIsCustomMode(false);
    setActiveModel(model);
  };

  const handleCustomModelSelect = () => {
    setIsCustomMode(true);
    if (customModelId) {
      setActiveModel(customModelId);
    }
  };

  const handleCustomModelIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomModelId(val);
    setActiveModel(val);
  };

  return (
    <div className="space-y-5">
      {/* Configure AI Brain Model */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm space-y-5 transition-colors duration-200">
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-zinc-800">
          <SettingsIcon className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-tight text-slate-800 dark:text-white">System Configuration Panel</h2>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans">Tune orchestrations and multi-agent system parameters.</p>
          </div>
        </div>

        {/* LLM Provider Selector */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-widest font-mono">
            <Globe className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            LLM Provider
          </label>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-sans leading-normal">
            Select your preferred AI inference provider. Each provider requires its own API key.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
            {LLM_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setLlmProvider(provider.id)}
                className={`flex flex-col items-start p-3 rounded-sm border text-left transition-all cursor-pointer ${
                  llmProvider === provider.id
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 font-bold text-slate-800 dark:text-white'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold font-mono">{provider.name}</span>
                  <span className={`text-[8px] font-mono font-bold border px-1 py-0.5 rounded-sm ${provider.badgeColor}`}>
                    {provider.badge}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-sans leading-normal line-clamp-2">
                  {provider.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Status Message */}
        <div className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-sm p-4 space-y-4 text-slate-700 dark:text-zinc-300 transition-colors duration-200">
          <div className="flex justify-between items-center gap-2.5 pb-2 border-b border-slate-200/50 dark:border-zinc-800/50">
            <div className="flex items-center gap-2.5">
              <Lock className="h-4.5 w-4.5 text-blue-600 dark:text-blue-500" />
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-[10px]">{currentProvider.name} API Key</h4>
            </div>
            <div>
              {hasKey ? (
                <span className="text-[8px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-sm">
                  KEY ACTIVE (EXPIRES IN {expiresInHours}H)
                </span>
              ) : (
                <span className="text-[8px] font-mono font-bold bg-rose-50 dark:bg-rose-950/25 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 px-2 py-0.5 rounded-sm">
                  NO KEY STORED
                </span>
              )}
            </div>
          </div>
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-widest font-mono">
                {currentProvider.name} API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasKey ? `•••••••••••••••••••••••••••••••• (Expires in ${expiresInHours}h)` : currentProvider.keyPlaceholder}
                className="w-full bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm p-2 text-[11px] outline-none font-mono text-slate-950 dark:text-white transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal font-sans">
              Your API Key is securely saved in your native OS Keyring (e.g. Windows Credential Locker). It auto-expires and will be wiped from the keyring 12 hours after saving.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim()}
                className={`px-4 py-1.5 font-bold text-[10px] uppercase tracking-wider rounded-sm transition-all ${
                  apiKey.trim()
                    ? "bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 cursor-pointer"
                    : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                }`}
              >
                Save API Key
              </button>
              {hasKey && (
                <button
                  onClick={handleClearApiKey}
                  className="px-4 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase tracking-wider rounded-sm transition-all cursor-pointer"
                >
                  Clear Key
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Parameter 1: Select Model */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-widest font-mono">
            <Cpu className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            Cognitive Language Engine
          </label>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-sans leading-normal">
            Choose the specific analytical core architecture for Swarm agents via {currentProvider.name}.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {providerModels.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                className={`flex flex-col items-start p-3 rounded-sm border text-left transition-all cursor-pointer ${
                  !isCustomMode && activeModel === model.id
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 font-bold text-slate-800 dark:text-white'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={`h-3.5 w-3.5 ${!isCustomMode && activeModel === model.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                  <span className="text-[10px] font-bold font-mono">{model.name}</span>
                  <span className={`text-[8px] font-mono font-bold border px-1 py-0.5 rounded-sm ${model.badgeColor}`}>
                    {model.badge}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-sans leading-normal">
                  {model.description}
                </span>
              </button>
            ))}

            {/* Custom Model Option */}
            <button
              onClick={handleCustomModelSelect}
              className={`flex flex-col items-start p-3 rounded-sm border text-left transition-all cursor-pointer ${
                isCustomMode
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 font-bold text-slate-800 dark:text-white'
                  : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Cpu className={`h-3.5 w-3.5 ${isCustomMode ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                <span className="text-[10px] font-bold font-mono">-- Custom Model ID --</span>
                <span className="text-[8px] font-mono font-bold bg-amber-50 dark:bg-amber-950/25 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 px-1 py-0.5 rounded-sm">
                  FLEXIBLE
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-sans leading-normal">
                Type in any custom model ID supported by {currentProvider.name}.
              </span>
            </button>
          </div>

          {isCustomMode && (
            <div className="pt-2 animate-fade-in">
              <label className="text-[10px] font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-widest font-mono block mb-1">
                Custom Model ID
              </label>
              <input
                type="text"
                value={customModelId}
                onChange={handleCustomModelIdChange}
                placeholder={`e.g. ${providerModels[0]?.id || 'model-name'}`}
                className="w-full max-w-md bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm p-2 text-[11px] outline-none font-mono text-slate-950 dark:text-white transition-all"
              />
              <label className="text-[10px] font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-widest font-mono block mt-3 mb-1">
                API Base URL (Optional, for Local LLMs)
              </label>
              <input
                type="text"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                placeholder="e.g. http://localhost:1234/v1 or http://localhost:11434"
                className="w-full max-w-md bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700 focus:border-blue-600 dark:focus:border-blue-500 rounded-sm p-2 text-[11px] outline-none font-mono text-slate-950 dark:text-white transition-all"
              />
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 font-sans">
                Leave blank to use the provider's default cloud API. Set this to point to LM Studio, Ollama, vLLM, etc.
              </p>
            </div>
          )}
        </div>

        {/* Parameter 2: Temperature Slider */}
        <div className="space-y-2 pt-1.5">
          <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-widest font-mono">
            <span className="flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              Cognitive Temperature
            </span>
            <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">{temperature.toFixed(1)}</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-sans leading-normal">
            Low restricts responses to strict math verification. High enables creative trend diagnostics.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono font-bold">STRICT (0.0)</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="flex-1 accent-blue-600 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full"
            />
            <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono font-bold">CREATIVE (1.0)</span>
          </div>
        </div>

        {/* Parameter 3: Swarm Pacing */}
        <div className="space-y-2 pt-1.5">
          <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-widest font-mono">
            <Sliders className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            Dialogue Log Refresh Rate
          </label>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-sans leading-normal">
            Controls visual progression speed of agent logs during swarm analytics pipeline steps.
          </p>
          <div className="flex gap-2 pt-1">
            {/* Instant */}
            <button
              onClick={() => setPacing('instant')}
              className={`px-3 py-1 border font-mono text-[10px] font-bold rounded-sm uppercase tracking-tight focus:outline-none cursor-pointer ${
                pacing === 'instant'
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                  : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              Realtime (0ms)
            </button>
            {/* Fast */}
            <button
              onClick={() => setPacing('fast')}
              className={`px-3 py-1 border font-mono text-[10px] font-bold rounded-sm uppercase tracking-tight focus:outline-none cursor-pointer ${
                pacing === 'fast'
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                  : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              Accelerate (400ms)
            </button>
            {/* Normal */}
            <button
              onClick={() => setPacing('normal')}
              className={`px-3 py-1 border font-mono text-[10px] font-bold rounded-sm uppercase tracking-tight focus:outline-none cursor-pointer ${
                pacing === 'normal'
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                  : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              Standard (800ms)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
