
import type { Category, Transaction, BudgetGoal } from './types';

// Renamed to defaultCategoriesSeed to reflect its new purpose for seeding
export const initialCategories: Category[] = [
  { id: 'cat1_seed', name: 'Groceries', icon: 'ShoppingCart', color: 'hsl(var(--chart-1))' },
  { id: 'cat2_seed', name: 'Salary', icon: 'Landmark', color: 'hsl(var(--chart-2))' }, 
  { id: 'cat3_seed', name: 'Dining Out', icon: 'Utensils', color: 'hsl(var(--chart-3))' },
  { id: 'cat4_seed', name: 'Transport', icon: 'Car', color: 'hsl(var(--chart-4))' },
  { id: 'cat5_seed', name: 'Entertainment', icon: 'Ticket', color: 'hsl(var(--chart-5))' },
  { id: 'cat6_seed', name: 'Utilities', icon: 'Lightbulb', color: 'hsl(197, 71%, 73%)'},
  { id: 'cat7_seed', name: 'Rent/Mortgage', icon: 'Home', color: 'hsl(217, 91%, 60%)' },
  { id: 'cat8_seed', name: 'Shopping', icon: 'ShoppingBag', color: 'hsl(347, 77%, 66%)' },
  { id: 'cat9_seed', name: 'Healthcare', icon: 'HeartPulse', color: 'hsl(0, 72%, 61%)' },
  { id: 'cat10_seed', name: 'Education', icon: 'BookOpen', color: 'hsl(173, 80%, 40%)' },
];

// These will no longer be used to initialize DataContext directly for logged-in users.
// Transactions and BudgetGoals will start empty for new users.
export const initialTransactions: Transaction[] = [];
export const initialBudgetGoals: BudgetGoal[] = [];

    