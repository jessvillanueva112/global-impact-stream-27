export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'partner' | 'donor';
}

export interface ImpactReport {
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  timestamp: Date;
  attachments?: string[];
}

export interface DashboardMetric {
  title: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}