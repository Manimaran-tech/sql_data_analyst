export interface SaleRecord {
  order_id: string;
  order_date: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  discount: number;
  region: string;
  sales_amount: number;
  customer_segment: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'donut' | 'stacked_bar' | 'horizontal_bar' | 'histogram' | 'funnel' | 'waterfall' | 'heatmap' | 'bubble';
  title: string;
  xAxisKey: string;
  yAxisKey: string;
  labelsMap?: { [key: string]: string };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  logs?: LogMessage[];
  sqlOrQueryDetails?: string;
  visualization?: {
    type: string;
    title: string;
    xAxisKey?: string;
    yAxisKey?: string;
    data: any[];
  };
  dashboardUrl?: string;
}

export interface LogMessage {
  id: string;
  timestamp: string;
  sender: 'SYSTEM' | 'SCHEMA ANALYST AGENT' | 'DATA COGNITIVE AGENT' | 'EXECUTIVE INSIGHT AGENT';
  text: string;
  status?: 'success' | 'working' | 'info';
}

export interface SwarmResponse {
  answer: string;
  chartData?: any[];
  chartConfig?: ChartConfig;
  sqlOrQueryDetails?: string;
  logs: Omit<LogMessage, 'timestamp'>[];
}

export interface WorkspaceState {
  currentQuery: string;
  isExecuting: boolean;
  logs: LogMessage[];
  lastResult?: SwarmResponse;
}

export interface FilterState {
  region: string;
  category: string;
  segment: string;
}
