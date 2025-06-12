
// src/contexts/DataContext.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Transaction, Category, BudgetGoal } from '@/lib/types';
import { initialCategories as defaultCategoriesSeed } from '@/lib/mock-data';
import { useAuthContext } from './AuthContext';
import { rtdb } from '@/lib/firebase/config';
import {
  ref,
  onValue,
  set,
  remove,
  push,
  get,
  update,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval } from 'date-fns';

interface UserSummary {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
}

interface DataContextProps {
  transactions: Transaction[];
  categories: Category[];
  budgetGoals: BudgetGoal[];
  summary: UserSummary;
  loadingData: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<Transaction | undefined>;
  updateTransaction: (updatedTransaction: Transaction, originalTransaction: Transaction) => Promise<void>;
  deleteTransaction: (transaction: Transaction) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category | undefined>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addBudgetGoal: (budgetGoal: Omit<BudgetGoal, 'id' | 'spentAmount'>) => Promise<BudgetGoal | undefined>;
  updateBudgetGoal: (budgetGoal: Omit<BudgetGoal, 'spentAmount'>) => Promise<void>;
  deleteBudgetGoal: (budgetGoalId: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryNameById: (id: string) => string;
  getTransactionsByCategory: (categoryId: string) => Transaction[];
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

const rtdbObjectToArray = <T extends { id: string }>(data: Record<string, Omit<T, 'id'>> | null): T[] => {
  if (!data) return [];
  return Object.entries(data).map(([id, value]) => ({ id, ...value } as T));
};

// Helper to calculate spent amount for a budget goal
const calculateSpentForBudgetPeriod = (
  allTransactions: Transaction[],
  categoryId: string,
  period: 'monthly' | 'yearly'
): number => {
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  if (period === 'monthly') {
    periodStart = startOfMonth(now);
    periodEnd = endOfMonth(now);
  } else { // yearly
    periodStart = startOfYear(now);
    periodEnd = endOfYear(now);
  }

  return allTransactions
    .filter(
      (tx) =>
        tx.categoryId === categoryId &&
        tx.type === 'expense' &&
        isWithinInterval(parseISO(tx.date), { start: periodStart, end: periodEnd })
    )
    .reduce((sum, tx) => sum + tx.amount, 0);
};


export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [summary, setSummary] = useState<UserSummary>({ totalIncome: 0, totalExpenses: 0, currentBalance: 0 });
  const [loadingData, setLoadingData] = useState(true);

  const seedDefaultCategories = useCallback(async (userId: string) => {
    const categoriesPath = `users/${userId}/categories`;
    const categoriesRef = ref(rtdb, categoriesPath);
    try {
      const snapshot = await get(categoriesRef);
      if (!snapshot.exists() || !snapshot.val()) {
        const updates: Record<string, any> = {};
        defaultCategoriesSeed.forEach(category => {
          const newId = category.id.endsWith("_seed") ? push(categoriesRef).key : category.id; // Ensure unique ID if seeding
          updates[`${categoriesPath}/${newId}`] = {
            name: category.name,
            icon: category.icon,
            color: category.color
          };
        });
        await update(ref(rtdb), updates);
      }
    } catch (error) {
      console.error("Error seeding default categories in RTDB:", error);
      toast({ title: "Setup Error", description: "Could not set up default categories.", variant: "destructive" });
    }
  }, [toast]);

  const initializeSummary = useCallback(async (userId: string) => {
    const summaryPath = `users/${userId}/summary`;
    const summaryRef = ref(rtdb, summaryPath);
    try {
      const snapshot = await get(summaryRef);
      if (!snapshot.exists() || !snapshot.val()) {
        await set(summaryRef, {
          totalIncome: 0,
          totalExpenses: 0,
          currentBalance: 0,
        });
      }
    } catch (error) {
      console.error("Error initializing summary in RTDB:", error);
      toast({ title: "Setup Error", description: "Could not initialize user summary.", variant: "destructive" });
    }
  }, [toast]);

  const recalculateAndSaveAllBudgetSpentAmounts = useCallback(async (userId: string, currentTransactions: Transaction[], currentBudgetGoals: BudgetGoal[]) => {
    if (!userId || currentBudgetGoals.length === 0) return;

    const updates: Record<string, number> = {};
    let changed = false;

    for (const goal of currentBudgetGoals) {
      const newSpentAmount = calculateSpentForBudgetPeriod(currentTransactions, goal.categoryId, goal.period);
      if (newSpentAmount !== goal.spentAmount) {
        updates[`users/${userId}/budgetGoals/${goal.id}/spentAmount`] = newSpentAmount;
        changed = true;
      }
    }

    if (changed) {
      try {
        await update(ref(rtdb), updates);
      } catch (error) {
        console.error("Error updating budget spent amounts:", error);
        toast({ title: "Data Sync Error", description: "Could not update budget spent amounts.", variant: "destructive" });
      }
    }
  }, [toast]);


  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCategories([]);
      setBudgetGoals([]);
      setSummary({ totalIncome: 0, totalExpenses: 0, currentBalance: 0 });
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    const userId = user.uid;

    seedDefaultCategories(userId);
    initializeSummary(userId);

    const categoriesRef = ref(rtdb, `users/${userId}/categories`);
    const unsubCategories = onValue(categoriesRef, (snapshot) => {
      setCategories(rtdbObjectToArray<Category>(snapshot.val()));
    }, (error) => console.error("RTDB category fetch error:", error));

    const transactionsRef = ref(rtdb, `users/${userId}/transactions`);
    const unsubTransactions = onValue(transactionsRef, (snapshot) => {
      const fetchedTransactions = rtdbObjectToArray<Transaction>(snapshot.val());
      setTransactions(fetchedTransactions);
      // After transactions update, recalculate budget spent amounts
      // Need to get current budget goals for this; onValue for budgets will handle initial set
    }, (error) => console.error("RTDB transaction fetch error:", error));

    const budgetGoalsRef = ref(rtdb, `users/${userId}/budgetGoals`);
    const unsubBudgetGoals = onValue(budgetGoalsRef, (snapshot) => {
      const fetchedBudgetGoals = rtdbObjectToArray<BudgetGoal>(snapshot.val()).map(g => ({...g, spentAmount: g.spentAmount || 0}));
      setBudgetGoals(fetchedBudgetGoals);
      // When budget goals or transactions change, recalculate spent amounts
      // This is called here and after transaction changes.
      // We need `transactions` state to be up-to-date for recalculation.
      // This might lead to calling it twice if transactions and budgets load separately.
      // A more sophisticated approach might use a combined effect or a debounced call.
      // For now, let's ensure `transactions` state is used for calculation.
      get(transactionsRef).then(transactionsSnapshot => {
         const currentTrx = rtdbObjectToArray<Transaction>(transactionsSnapshot.val());
         recalculateAndSaveAllBudgetSpentAmounts(userId, currentTrx, fetchedBudgetGoals);
      });

    }, (error) => console.error("RTDB budget goal fetch error:", error));


    const summaryRef = ref(rtdb, `users/${userId}/summary`);
    const unsubSummary = onValue(summaryRef, (snapshot) => {
      const summaryData = snapshot.val();
      if (summaryData) {
        setSummary(summaryData);
      } else {
        set(ref(rtdb, `users/${userId}/summary`), { totalIncome: 0, totalExpenses: 0, currentBalance: 0 });
      }
      setLoadingData(false);
    }, (error) => {
      console.error("RTDB summary fetch error:", error);
      setLoadingData(false);
    });

    return () => {
      unsubCategories();
      unsubTransactions();
      unsubBudgetGoals();
      unsubSummary();
    };
  }, [user, toast, seedDefaultCategories, initializeSummary, recalculateAndSaveAllBudgetSpentAmounts]);

  // Effect to recalculate budget spent amounts when transactions change
  useEffect(() => {
    if (user && transactions.length > 0 && budgetGoals.length > 0) {
      recalculateAndSaveAllBudgetSpentAmounts(user.uid, transactions, budgetGoals);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, user]); // Only re-run if transactions or user change. budgetGoals dependency handled by its own onValue.


  const addTransaction = async (transactionData: Omit<Transaction, 'id'>): Promise<Transaction | undefined> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return undefined;
    }
    try {
      const transactionsPath = `users/${user.uid}/transactions`;
      const newItemRef = push(ref(rtdb, transactionsPath));
      const newTransactionId = newItemRef.key as string;
      const newTransactionFull = { id: newTransactionId, ...transactionData };

      const summaryRef = ref(rtdb, `users/${user.uid}/summary`);
      const currentSummarySnapshot = await get(summaryRef);
      let currentSummaryData = currentSummarySnapshot.val() || { totalIncome: 0, totalExpenses: 0, currentBalance: 0 };

      if (newTransactionFull.type === 'income') {
        currentSummaryData.totalIncome += newTransactionFull.amount;
      } else {
        currentSummaryData.totalExpenses += newTransactionFull.amount;
      }
      currentSummaryData.currentBalance = currentSummaryData.totalIncome - currentSummaryData.totalExpenses;

      const updates: Record<string, any> = {};
      updates[`${transactionsPath}/${newTransactionId}`] = transactionData;
      updates[`users/${user.uid}/summary`] = currentSummaryData;

      await update(ref(rtdb), updates);
      // recalculateAndSaveAllBudgetSpentAmounts will be triggered by the transactions state update via useEffect
      return newTransactionFull;
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({ title: "Error", description: "Could not add transaction.", variant: "destructive" });
      return undefined;
    }
  };

  const updateTransaction = async (updatedTransaction: Transaction, originalTransaction: Transaction): Promise<void> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const { id, ...dataToUpdate } = updatedTransaction;
      const summaryRef = ref(rtdb, `users/${user.uid}/summary`);
      const currentSummarySnapshot = await get(summaryRef);
      let currentSummaryData = currentSummarySnapshot.val() || { totalIncome: 0, totalExpenses: 0, currentBalance: 0 };

      if (originalTransaction.type === 'income') {
        currentSummaryData.totalIncome -= originalTransaction.amount;
      } else {
        currentSummaryData.totalExpenses -= originalTransaction.amount;
      }
      if (updatedTransaction.type === 'income') {
        currentSummaryData.totalIncome += updatedTransaction.amount;
      } else {
        currentSummaryData.totalExpenses += updatedTransaction.amount;
      }
      currentSummaryData.currentBalance = currentSummaryData.totalIncome - currentSummaryData.totalExpenses;

      const updates: Record<string, any> = {};
      updates[`users/${user.uid}/transactions/${id}`] = dataToUpdate;
      updates[`users/${user.uid}/summary`] = currentSummaryData;

      await update(ref(rtdb), updates);
      // recalculateAndSaveAllBudgetSpentAmounts will be triggered by the transactions state update via useEffect
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({ title: "Error", description: "Could not update transaction.", variant: "destructive" });
    }
  };

  const deleteTransaction = async (transactionToDelete: Transaction): Promise<void> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const summaryRef = ref(rtdb, `users/${user.uid}/summary`);
      const currentSummarySnapshot = await get(summaryRef);
      let currentSummaryData = currentSummarySnapshot.val() || { totalIncome: 0, totalExpenses: 0, currentBalance: 0 };

      if (transactionToDelete.type === 'income') {
        currentSummaryData.totalIncome -= transactionToDelete.amount;
      } else {
        currentSummaryData.totalExpenses -= transactionToDelete.amount;
      }
      currentSummaryData.currentBalance = currentSummaryData.totalIncome - currentSummaryData.totalExpenses;

      const updates: Record<string, any> = {};
      updates[`users/${user.uid}/transactions/${transactionToDelete.id}`] = null;
      updates[`users/${user.uid}/summary`] = currentSummaryData;

      await update(ref(rtdb), updates);
      // recalculateAndSaveAllBudgetSpentAmounts will be triggered by the transactions state update via useEffect
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({ title: "Error", description: "Could not delete transaction.", variant: "destructive" });
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>): Promise<Category | undefined> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return undefined;
    }
    try {
      const categoriesPath = `users/${user.uid}/categories`;
      const newItemRef = push(ref(rtdb, categoriesPath));
      const newCategory = { id: newItemRef.key as string, ...categoryData };
      await set(newItemRef, categoryData);
      return newCategory;
    } catch (error) {
      console.error("Error adding category:", error);
      toast({ title: "Error", description: "Could not add category.", variant: "destructive" });
      return undefined;
    }
  };

  const updateCategory = async (updatedCategory: Category): Promise<void> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const { id, ...dataToUpdate } = updatedCategory;
      const itemRef = ref(rtdb, `users/${user.uid}/categories/${id}`);
      await set(itemRef, dataToUpdate);
      // If category details relevant to budget goals change (e.g. name, not ID),
      // this could trigger UI updates but not direct spentAmount recalculation unless categoryId mapping changes.
      // For now, assuming categoryId is immutable for a category once created.
      // If a category name changes, UI relying on it will update.
      // Also, we might need to re-evaluate spent amounts if category relationships to budgets are altered.
      // For simplicity, we'll assume category ID is the key link.
      if (user) {
         recalculateAndSaveAllBudgetSpentAmounts(user.uid, transactions, budgetGoals);
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast({ title: "Error", description: "Could not update category.", variant: "destructive" });
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const basePath = `users/${user.uid}`;
      const updates: Record<string, any | null> = {};
      updates[`${basePath}/categories/${categoryId}`] = null;

      const summaryRef = ref(rtdb, `${basePath}/summary`);
      const currentSummarySnapshot = await get(summaryRef);
      let currentSummaryData = currentSummarySnapshot.val() || { totalIncome: 0, totalExpenses: 0, currentBalance: 0 };

      const transactionsQuery = query(ref(rtdb, `${basePath}/transactions`), orderByChild('categoryId'), equalTo(categoryId));
      const transactionsSnapshot = await get(transactionsQuery);
      const deletedTransactionsForSummary: Transaction[] = [];

      if (transactionsSnapshot.exists()) {
        transactionsSnapshot.forEach(childSnapshot => {
          updates[`${basePath}/transactions/${childSnapshot.key}`] = null;
          const tx = childSnapshot.val() as Transaction;
          deletedTransactionsForSummary.push(tx); // Collect for summary update
        });
      }

      // Adjust summary based on deleted transactions
      deletedTransactionsForSummary.forEach(tx => {
        if (tx.type === 'income') {
          currentSummaryData.totalIncome -= tx.amount;
        } else {
          currentSummaryData.totalExpenses -= tx.amount;
        }
      });
      currentSummaryData.currentBalance = currentSummaryData.totalIncome - currentSummaryData.totalExpenses;
      updates[`${basePath}/summary`] = currentSummaryData;

      const budgetGoalsQuery = query(ref(rtdb, `${basePath}/budgetGoals`), orderByChild('categoryId'), equalTo(categoryId));
      const budgetGoalsSnapshot = await get(budgetGoalsQuery);
      if (budgetGoalsSnapshot.exists()) {
        budgetGoalsSnapshot.forEach(childSnapshot => {
          updates[`${basePath}/budgetGoals/${childSnapshot.key}`] = null;
        });
      }

      await update(ref(rtdb), updates);
      // After category and its transactions/budgets are deleted, the local state will update via onValue listeners.
      // The useEffect for transactions changing should then trigger recalculateAndSaveAllBudgetSpentAmounts,
      // which will effectively remove contributions from the deleted category's budgets.
      toast({ title: "Category Deleted", description: "Category and associated data deleted, summary updated." });
    } catch (error) {
      console.error("Error deleting category and associated data from RTDB:", error);
      toast({ title: "Error", description: "Could not delete category.", variant: "destructive" });
    }
  };

  const addBudgetGoal = async (budgetGoalData: Omit<BudgetGoal, 'id' | 'spentAmount'>): Promise<BudgetGoal | undefined> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return undefined;
    }
    try {
      const budgetGoalsPath = `users/${user.uid}/budgetGoals`;
      const newItemRef = push(ref(rtdb, budgetGoalsPath));
      const newBudgetGoalId = newItemRef.key as string;
      
      const initialSpentAmount = calculateSpentForBudgetPeriod(transactions, budgetGoalData.categoryId, budgetGoalData.period);
      const newBudgetGoalWithSpent: Omit<BudgetGoal, 'id'> = { ...budgetGoalData, spentAmount: initialSpentAmount };
      
      await set(newItemRef, newBudgetGoalWithSpent);
      return { id: newBudgetGoalId, ...newBudgetGoalWithSpent };
    } catch (error) {
      console.error("Error adding budget goal:", error);
      toast({ title: "Error", description: "Could not add budget goal.", variant: "destructive" });
      return undefined;
    }
  };

  const updateBudgetGoal = async (budgetGoalToUpdate: Omit<BudgetGoal, 'spentAmount'>): Promise<void> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const { id, ...dataToUpdate } = budgetGoalToUpdate;
      const currentSpentAmount = calculateSpentForBudgetPeriod(transactions, dataToUpdate.categoryId, dataToUpdate.period);
      const finalDataToUpdate = { ...dataToUpdate, spentAmount: currentSpentAmount };

      const itemRef = ref(rtdb, `users/${user.uid}/budgetGoals/${id}`);
      await set(itemRef, finalDataToUpdate);
    } catch (error) {
      console.error("Error updating budget goal:", error);
      toast({ title: "Error", description: "Could not update budget goal.", variant: "destructive" });
    }
  };

  const deleteBudgetGoal = async (budgetGoalId: string): Promise<void> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const itemRef = ref(rtdb, `users/${user.uid}/budgetGoals/${budgetGoalId}`);
      await remove(itemRef);
    } catch (error) {
      console.error("Error deleting budget goal:", error);
      toast({ title: "Error", description: "Could not delete budget goal.", variant: "destructive" });
    }
  };

  const getCategoryById = useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  const getCategoryNameById = useCallback((id: string) => {
    return categories.find(cat => cat.id === id)?.name || 'N/A';
  }, [categories]);

  const getTransactionsByCategory = useCallback((categoryId: string) => {
    return transactions.filter(t => t.categoryId === categoryId && t.type === 'expense');
  }, [transactions]);

  return (
    <DataContext.Provider value={{
      transactions, categories, budgetGoals, summary, loadingData,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addBudgetGoal, updateBudgetGoal, deleteBudgetGoal,
      getCategoryById, getCategoryNameById, getTransactionsByCategory
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
