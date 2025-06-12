
import type { LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon: keyof typeof import('lucide-react')['icons'] | string; // Lucide icon name or custom SVG path
  color?: string; // Optional color for category representation
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // ISO string for date
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
}

export interface BudgetGoal {
  id: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'yearly'; // Simplified period
  spentAmount: number; // Amount spent towards this goal in the current period
}

