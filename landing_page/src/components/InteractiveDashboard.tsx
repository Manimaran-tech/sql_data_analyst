import React, { useState, useMemo } from 'react';
import { API_BASE_URL } from '../config';
import { SaleRecord, SwarmResponse } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  ScatterChart,
  Scatter,
  LineChart,
  Line
} from 'recharts';
import { BarChart2, Download, Image as ImageIcon, Table, RefreshCcw, PieChart as PieIcon, LineChart as LineIcon, Activity, Grid } from 'lucide-react';

interface InteractiveDashboardProps {
  dataset: SaleRecord[];
  swarmResult: SwarmResponse | null;
  dashboardUrl: string | null;
}

const PLOT_COLORS = ['#2563eb', '#0ea5e9', '#0d9488', '#4f46e5', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

const PREMIUM_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#0f172a',
    borderRadius: '4px',
    border: '1px solid #1e293b',
    fontSize: '10px',
    fontFamily: 'JetBrains Mono, monospace',
    color: '#f8fafc',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
  },
  itemStyle: { color: '#38bdf8' },
  labelStyle: { color: '#94a3b8', fontWeight: 600 }
};

export default function InteractiveDashboard({ dataset, swarmResult, dashboardUrl }: InteractiveDashboardProps) {
  const [showRawTable, setShowRawTable] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<string | null>(null);

  // Extract visualization specifications safely
  const chartConfig = swarmResult?.chartConfig;
  const rawChartData = swarmResult?.chartData || [];

  // Parse keys and labels dynamically to avoid assumptions
  const { data, resolvedXKey, resolvedYKey, keys, xType } = useMemo(() => {
    if (!rawChartData || rawChartData.length === 0) {
      return { data: [], resolvedXKey: 'label', resolvedYKey: 'value', keys: [], xType: 'category' as const };
    }

    const firstItem = rawChartData[0];
    const dataKeys = Object.keys(firstItem);
    
    // Resolve X key based on chartConfig, fallback to first non-number column or first column
    let xKey = chartConfig?.xAxisKey || 'label';
    if (!dataKeys.includes(xKey)) {
      const stringCol = dataKeys.find(k => typeof firstItem[k] === 'string');
      xKey = stringCol || dataKeys[0] || 'label';
    }

    // Resolve Y key based on chartConfig, fallback to first number column
    let yKey = chartConfig?.yAxisKey || 'value';
    if (!dataKeys.includes(yKey)) {
      const numCol = dataKeys.find(k => k !== xKey && typeof firstItem[k] === 'number');
      yKey = numCol || dataKeys.find(k => k !== xKey) || 'value';
    }

    // Determine type of XAxis
    const xAxisVal = firstItem[xKey];
    const typeOfX = typeof xAxisVal === 'number' ? ('number' as const) : ('category' as const);

    return {
      data: rawChartData,
      resolvedXKey: xKey,
      resolvedYKey: yKey,
      keys: dataKeys,
      xType: typeOfX
    };
  }, [rawChartData, chartConfig]);

  const chartType = chartConfig?.type || 'bar';
  const activeChartType = selectedChartType || chartType;

  // Get description based on the classification category of the chart
  const chartCategoryInfo = useMemo(() => {
    switch (activeChartType) {
      case 'bar':
      case 'horizontal_bar':
        return {
          category: 'Comparison & Ranking',
          desc: 'Used to compare discrete quantities or values across different categories.'
        };
      case 'line':
      case 'area':
        return {
          category: 'Comparison & Trends',
          desc: 'Illustrates fluctuations, cycles, or sequential developments over a timeline.'
        };
      case 'pie':
      case 'doughnut':
      case 'donut':
      case 'stacked_bar':
        return {
          category: 'Composition & Proportions',
          desc: 'Represents parts of a whole and individual category contributions.'
        };
      case 'scatter':
      case 'bubble':
      case 'histogram':
        return {
          category: 'Distribution & Statistics',
          desc: 'Visualizes data frequency density or correlation patterns between variables.'
        };
      default:
        return {
          category: 'Business Intelligence Spec',
          desc: 'Analytical representation constructed by the swarm cognitive agents.'
        };
    }
  }, [activeChartType]);

  const formattedChartTitle = chartConfig?.title || 'Swarm Analyzed Query Metrics';

  return (
    <div className="space-y-6">
      {/* Overview Stat Panel / Dashboard Title */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-sm bg-blue-50 dark:bg-blue-950/45 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-tight text-slate-800 dark:text-white">
              Swarm Query Visualizer
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans">
              Displays multi-modal Seaborn dashboards and dynamic interactive Recharts immediately generated from the latest execution.
            </p>
          </div>
        </div>

        {data.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1 text-right">
              <span className="block text-[8px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono">Chart Category</span>
              <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">{chartCategoryInfo.category}</span>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1 text-right">
              <span className="block text-[8px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono">Chart Type</span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase font-mono">{chartType}</span>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1 text-right">
              <span className="block text-[8px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono">Data Records</span>
              <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 font-mono">{data.length} rows</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Dual visualizer grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Visualizer 1: Seaborn Dashboard (12 cols) */}
        <div className="col-span-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm flex flex-col justify-between shadow-sm transition-colors duration-200">
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-tight text-slate-700 dark:text-zinc-300">Advanced Seaborn Dashboard</h3>
            </div>
            {dashboardUrl && (
              <a
                href={`${API_BASE_URL}/api/download-dashboard?path=${encodeURIComponent(dashboardUrl)}`}
                download="swarm_analyst_dashboard.png"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-[9px] uppercase tracking-wider rounded border border-slate-200 dark:border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="h-3 w-3" />
                Download PNG
              </a>
            )}
          </div>

          <div className="p-6 flex-1 flex items-center justify-center min-h-[670px] bg-slate-50/30 dark:bg-zinc-950/20">
            {dashboardUrl ? (
              <div className="w-full h-full flex items-center justify-center border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 rounded shadow-sm overflow-hidden">
                <img
                  src={dashboardUrl}
                  alt="Seaborn Dashboard Output"
                  className="max-h-[650px] max-w-full object-contain rounded-sm"
                />
              </div>
            ) : (
              <div className="text-center space-y-2 text-slate-400 dark:text-zinc-500">
                <ImageIcon className="h-8 w-8 mx-auto stroke-1 text-slate-300 dark:text-zinc-600 animate-pulse" />
                <p className="text-xs font-mono">No Seaborn image dashboard returned.</p>
              </div>
            )}
          </div>
        </div>

        {/* Visualizer 2: Dynamic Interactive Recharts (12 cols) */}
        <div className="col-span-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm flex flex-col justify-between shadow-sm transition-colors duration-200">
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-tight text-slate-700 dark:text-zinc-300">{formattedChartTitle}</h3>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-none">{chartCategoryInfo.desc}</p>
              </div>
            </div>
            {data.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-0.5 rounded-sm flex-wrap">
                {(['bar', 'line', 'area', 'pie', 'doughnut', 'horizontal_bar', 'histogram', 'scatter'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedChartType(t)}
                    className={`px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold uppercase tracking-wider font-mono transition-colors cursor-pointer ${
                      activeChartType === t
                        ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 flex-1 flex items-center justify-center min-h-[500px] select-none">
            {data.length > 0 ? (
              <div className="w-full h-[480px]">
                <ResponsiveContainer width="100%" height="100%">
                  {(() => {
                    switch (activeChartType) {
                      case 'line':
                        return (
                          <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-stroke)" />
                            <XAxis dataKey={resolvedXKey} stroke="var(--axis-stroke)" fontSize={9} tickLine={false} />
                            <YAxis stroke="var(--axis-stroke)" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip {...PREMIUM_TOOLTIP_STYLE} />
                            <Line type="monotone" dataKey={resolvedYKey} stroke="#2563eb" strokeWidth={2} activeDot={{ r: 4 }} />
                          </LineChart>
                        );
                      case 'area':
                        return (
                          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorDashboardArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-stroke)" />
                            <XAxis dataKey={resolvedXKey} stroke="var(--axis-stroke)" fontSize={9} tickLine={false} />
                            <YAxis stroke="var(--axis-stroke)" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip {...PREMIUM_TOOLTIP_STYLE} />
                            <Area type="monotone" dataKey={resolvedYKey} stroke="#4f46e5" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDashboardArea)" />
                          </AreaChart>
                        );
                      case 'horizontal_bar':
                        return (
                          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--grid-stroke)" />
                            <XAxis type="number" stroke="var(--axis-stroke)" fontSize={9} tickLine={false} />
                            <YAxis dataKey={resolvedXKey} type="category" stroke="var(--axis-stroke)" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip {...PREMIUM_TOOLTIP_STYLE} />
                            <Bar dataKey={resolvedYKey} fill="#0d9488" radius={[0, 2, 2, 0]}>
                              {data.map((e, index) => (
                                <Cell key={`cell-${index}`} fill={PLOT_COLORS[index % PLOT_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        );
                      case 'pie':
                      case 'doughnut':
                      case 'donut':
                        const innerRad = (activeChartType === 'doughnut' || activeChartType === 'donut') ? 42 : 0;
                        return (
                          <PieChart>
                            <Pie
                              data={data}
                              cx="50%"
                              cy="50%"
                              innerRadius={innerRad}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey={resolvedYKey}
                              nameKey={resolvedXKey}
                            >
                              {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PLOT_COLORS[index % PLOT_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip {...PREMIUM_TOOLTIP_STYLE} />
                            <Legend verticalAlign="bottom" height={24} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '9px' }} />
                          </PieChart>
                        );
                      case 'stacked_bar':
                        // Filter numeric fields other than X axis key to show multi-segment stacking
                        const stackKeys = keys.filter(k => k !== resolvedXKey && typeof data[0][k] === 'number');
                        const finalStackKeys = stackKeys.length > 0 ? stackKeys : [resolvedYKey];
                        return (
                          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-stroke)" />
                            <XAxis dataKey={resolvedXKey} stroke="var(--axis-stroke)" fontSize={9} tickLine={false} />
                            <YAxis stroke="var(--axis-stroke)" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip {...PREMIUM_TOOLTIP_STYLE} />
                            {finalStackKeys.map((k, index) => (
                              <Bar key={k} dataKey={k} stackId="a" fill={PLOT_COLORS[index % PLOT_COLORS.length]} />
                            ))}
                            <Legend verticalAlign="bottom" height={24} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '9px' }} />
                          </BarChart>
                        );
                      case 'scatter':
                      case 'bubble':
                        return (
                          <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" />
                            <XAxis type={xType} dataKey={resolvedXKey} stroke="var(--axis-stroke)" fontSize={9} name={resolvedXKey} />
                            <YAxis type="number" dataKey={resolvedYKey} stroke="var(--axis-stroke)" fontSize={9} name={resolvedYKey} />
                            <Tooltip {...PREMIUM_TOOLTIP_STYLE} />
                            <Scatter name={formattedChartTitle} data={data} fill="#8b5cf6">
                              {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PLOT_COLORS[index % PLOT_COLORS.length]} />
                              ))}
                            </Scatter>
                          </ScatterChart>
                        );
                      case 'histogram':
                        return (
                          <BarChart data={data} barGap={0} barCategoryGap={1} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-stroke)" />
                            <XAxis dataKey={resolvedXKey} stroke="var(--axis-stroke)" fontSize={9} tickLine={false} />
                            <YAxis stroke="var(--axis-stroke)" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip {...PREMIUM_TOOLTIP_STYLE} />
                            <Bar dataKey={resolvedYKey} fill="#10b981" />
                          </BarChart>
                        );
                      case 'bar':
                      default:
                        return (
                          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-stroke)" />
                            <XAxis dataKey={resolvedXKey} stroke="var(--axis-stroke)" fontSize={9} tickLine={false} />
                            <YAxis stroke="var(--axis-stroke)" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip {...PREMIUM_TOOLTIP_STYLE} />
                            <Bar dataKey={resolvedYKey} fill="#2563eb" radius={[2, 2, 0, 0]}>
                              {data.map((e, index) => (
                                <Cell key={`cell-${index}`} fill={PLOT_COLORS[index % PLOT_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        );
                    }
                  })()}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center space-y-2 text-slate-400">
                <BarChart2 className="h-8 w-8 mx-auto stroke-1 text-slate-300 animate-pulse" />
                <p className="text-xs font-mono">No interactive chart metrics generated.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Query raw database records list */}
      {data.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm shadow-sm overflow-hidden transition-colors duration-200">
          <button
            onClick={() => setShowRawTable(!showRawTable)}
            className="w-full px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Table className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-tight text-slate-700 dark:text-zinc-300">Tabular Query Records</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
              {showRawTable ? 'Hide Table' : 'Show Table'}
            </span>
          </button>

          {showRawTable && (
            <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/20">
              <div className="overflow-x-auto max-h-60 border border-slate-200 dark:border-zinc-800 rounded-sm select-text">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-zinc-800 text-left font-sans text-[11px]">
                  <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 font-mono text-[9px] uppercase font-bold sticky top-0 border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      {keys.map((col) => (
                        <th key={col} className="px-3 py-2 whitespace-nowrap">
                          {col.replace(/_/g, ' ').toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {data.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        {keys.map((col) => {
                          const val = row[col];
                          let displayVal = '';
                          if (val === null || val === undefined) {
                            displayVal = 'NULL';
                          } else if (typeof val === 'object') {
                            displayVal = JSON.stringify(val);
                          } else if (typeof val === 'number') {
                            if (col.includes('price') || col.includes('amount') || col.includes('revenue') || col.includes('sales')) {
                              displayVal = `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            } else if (col.includes('discount') || col.includes('rate')) {
                              displayVal = val <= 1.0 ? `${(val * 100).toFixed(0)}%` : `${val}%`;
                            } else {
                              displayVal = val.toLocaleString();
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
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
