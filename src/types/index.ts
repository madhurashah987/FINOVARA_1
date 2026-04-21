export interface FinancialData {
  revenue: number;
  expenses: number;
  netIncome: number;
  assets: number;
  liabilities: number;
  equity: number;
  cashFlow: number;
  date: string;
}

export interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  impact: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SimulationParams {
  revenueGrowth: number;
  expenseReduction: number;
  marketVolatility: number;
}

export interface SimulationResult {
  projectedRevenue: number[];
  projectedIncome: number[];
  labels: string[];
}
