import type { Category, Transaction, BudgetGoal } from './types';

export const initialCategories: Category[] = [
  { id: 'cat1', name: 'Groceries', icon: 'ShoppingCart', color: 'hsl(var(--chart-1))' },
  { id: 'cat2', name: 'Salary', icon: 'Landmark', color: 'hsl(var(--chart-2))' }, // Typically income
  { id: 'cat3', name: 'Dining Out', icon: 'Utensils', color: 'hsl(var(--chart-3))' },
  { id: 'cat4', name: 'Transport', icon: 'Car', color: 'hsl(var(--chart-4))' },
  { id: 'cat5', name: 'Entertainment', icon: 'Ticket', color: 'hsl(var(--chart-5))' },
  { id: 'cat6', name: 'Utilities', icon: 'Lightbulb', color: 'hsl(197, 71%, 73%)'},
  { id: 'cat7', name: 'Rent/Mortgage', icon: 'Home', color: 'hsl(217, 91%, 60%)' },
];

export const initialTransactions: Transaction[] = [];

export const initialBudgetGoals: BudgetGoal[] = [];
