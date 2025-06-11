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

export const initialTransactions: Transaction[] = [
  { id: 'txn1', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), description: 'Weekly groceries', amount: 75.50, type: 'expense', categoryId: 'cat1' },
  { id: 'txn2', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: 'Monthly Salary', amount: 3000, type: 'income', categoryId: 'cat2' },
  { id: 'txn3', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), description: 'Dinner with friends', amount: 45.00, type: 'expense', categoryId: 'cat3' },
  { id: 'txn4', date: new Date().toISOString(), description: 'Gasoline', amount: 50.00, type: 'expense', categoryId: 'cat4' },
  { id: 'txn5', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: 'Movie tickets', amount: 25.00, type: 'expense', categoryId: 'cat5' },
];

export const initialBudgetGoals: BudgetGoal[] = [
  { id: 'bg1', categoryId: 'cat1', amount: 300, period: 'monthly' },
  { id: 'bg2', categoryId: 'cat3', amount: 150, period: 'monthly' },
  { id: 'bg3', categoryId: 'cat5', amount: 100, period: 'monthly' },
];
