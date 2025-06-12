
import type { Category, Transaction, BudgetGoal } from './types';

// Renamed to defaultCategoriesSeed to reflect its new purpose for seeding
export const initialCategories: Category[] = [
  { id: 'cat1_seed', name: 'Groceries', icon: 'ShoppingCart', color: 'hsl(231, 48%, 48%)' }, // was --chart-1
  { id: 'cat2_seed', name: 'Salary', icon: 'Landmark', color: 'hsl(174, 100%, 29.4%)' }, // was --chart-2
  { id: 'cat3_seed', name: 'Dining Out', icon: 'Utensils', color: 'hsl(25, 80%, 55%)' }, // was --chart-3
  { id: 'cat4_seed', name: 'Transport', icon: 'Car', color: 'hsl(280, 65%, 60%)' }, // was --chart-4
  { id: 'cat5_seed', name: 'Entertainment', icon: 'Ticket', color: 'hsl(50, 75%, 55%)' }, // was --chart-5
  { id: 'cat6_seed', name: 'Utilities', icon: 'Lightbulb', color: 'hsl(197, 71%, 73%)'},
  { id: 'cat7_seed', name: 'Rent/Mortgage', icon: 'Home', color: 'hsl(217, 91%, 60%)' },
  { id: 'cat8_seed', name: 'Shopping', icon: 'ShoppingBag', color: 'hsl(347, 77%, 66%)' },
  { id: 'cat9_seed', name: 'Healthcare', icon: 'HeartPulse', color: 'hsl(0, 72%, 61%)' },
  { id: 'cat10_seed', name: 'Education', icon: 'BookOpen', color: 'hsl(173, 80%, 40%)' },
  { id: 'cat11_seed', name: 'Personal Care', icon: 'Palette', color: 'hsl(300, 60%, 70%)' },
  { id: 'cat12_seed', name: 'Fitness', icon: 'Dumbbell', color: 'hsl(120, 50%, 60%)' },
  { id: 'cat13_seed', name: 'Gifts', icon: 'Gift', color: 'hsl(330, 70%, 75%)' },
  { id: 'cat14_seed', name: 'Travel', icon: 'Plane', color: 'hsl(200, 80%, 65%)' },
  { id: 'cat15_seed', name: 'Subscriptions', icon: 'Repeat', color: 'hsl(260, 55%, 65%)' },
  { id: 'cat16_seed', name: 'Insurance', icon: 'ShieldCheck', color: 'hsl(220, 40%, 55%)' },
  { id: 'cat17_seed', name: 'Investments', icon: 'TrendingUp', color: 'hsl(150, 65%, 45%)' },
  { id: 'cat18_seed', name: 'Pets', icon: 'Dog', color: 'hsl(40, 70%, 60%)' },
  { id: 'cat19_seed', name: 'Kids', icon: 'Baby', color: 'hsl(180, 60%, 75%)' },
  { id: 'cat20_seed', name: 'Charity', icon: 'HelpingHand', color: 'hsl(270, 50%, 70%)' },
  { id: 'cat21_seed', name: 'Home Improvement', icon: 'Wrench', color: 'hsl(30, 60%, 50%)' },
  { id: 'cat22_seed', name: 'Electronics', icon: 'Smartphone', color: 'hsl(240, 30%, 65%)' },
];

// These will no longer be used to initialize DataContext directly for logged-in users.
// Transactions and BudgetGoals will start empty for new users.
export const initialTransactions: Transaction[] = [];
export const initialBudgetGoals: BudgetGoal[] = [];

    
