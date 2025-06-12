
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
  addBudgetGoal: (budgetGoal: Omit<BudgetGoal, 'id'>) => Promise<BudgetGoal | undefined>;
  updateBudgetGoal: (budgetGoal: BudgetGoal) => Promise<void>;
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
          updates[`${categoriesPath}/${category.id}`] = { 
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
    }, (error) => {
      console.error("Error fetching categories from RTDB:", error);
      toast({ title: "Data Error", description: "Could not load categories.", variant: "destructive" });
    });

    const transactionsRef = ref(rtdb, `users/${userId}/transactions`);
    const unsubTransactions = onValue(transactionsRef, (snapshot) => {
      setTransactions(rtdbObjectToArray<Transaction>(snapshot.val()));
    }, (error) => {
      console.error("Error fetching transactions from RTDB:", error);
      toast({ title: "Data Error", description: "Could not load transactions.", variant: "destructive" });
    });

    const budgetGoalsRef = ref(rtdb, `users/${userId}/budgetGoals`);
    const unsubBudgetGoals = onValue(budgetGoalsRef, (snapshot) => {
      setBudgetGoals(rtdbObjectToArray<BudgetGoal>(snapshot.val()));
    }, (error) => {
      console.error("Error fetching budget goals from RTDB:", error);
      toast({ title: "Data Error", description: "Could not load budget goals.", variant: "destructive" });
    });

    const summaryRef = ref(rtdb, `users/${userId}/summary`);
    const unsubSummary = onValue(summaryRef, (snapshot) => {
      const summaryData = snapshot.val();
      if (summaryData) {
        setSummary(summaryData);
      } else {
        // If summary doesn't exist upon listener attachment, initialize it.
        set(ref(rtdb, `users/${userId}/summary`), { totalIncome: 0, totalExpenses: 0, currentBalance: 0 });
      }
      setLoadingData(false); // Data loading complete
    }, (error) => {
      console.error("Error fetching summary from RTDB:", error);
      toast({ title: "Data Error", description: "Could not load user summary.", variant: "destructive" });
      setLoadingData(false);
    });

    return () => {
      unsubCategories();
      unsubTransactions();
      unsubBudgetGoals();
      unsubSummary();
    };
  }, [user, toast, seedDefaultCategories, initializeSummary]);

  const addTransaction = async (transactionData: Omit<Transaction, 'id'>): Promise<Transaction | undefined> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return undefined;
    }
    try {
      const transactionsPath = `users/${user.uid}/transactions`;
      const newItemRef = push(ref(rtdb, transactionsPath));
      const newTransactionId = newItemRef.key as string;
      const newTransaction = { id: newTransactionId, ...transactionData };
      
      const summaryRef = ref(rtdb, `users/${user.uid}/summary`);
      const currentSummarySnapshot = await get(summaryRef);
      let currentSummaryData = currentSummarySnapshot.val() || { totalIncome: 0, totalExpenses: 0, currentBalance: 0 };
      
      if (newTransaction.type === 'income') {
        currentSummaryData.totalIncome += newTransaction.amount;
      } else {
        currentSummaryData.totalExpenses += newTransaction.amount;
      }
      currentSummaryData.currentBalance = currentSummaryData.totalIncome - currentSummaryData.totalExpenses;
      
      const updates: Record<string, any> = {};
      updates[`${transactionsPath}/${newTransactionId}`] = transactionData; // Save transaction without ID in its object
      updates[`users/${user.uid}/summary`] = currentSummaryData;

      await update(ref(rtdb), updates);
      return newTransaction;

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

      // Revert original transaction's impact
      if (originalTransaction.type === 'income') {
        currentSummaryData.totalIncome -= originalTransaction.amount;
      } else {
        currentSummaryData.totalExpenses -= originalTransaction.amount;
      }

      // Apply updated transaction's impact
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
      updates[`users/${user.uid}/transactions/${transactionToDelete.id}`] = null; // Delete transaction
      updates[`users/${user.uid}/summary`] = currentSummaryData;

      await update(ref(rtdb), updates);
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
      
      if (transactionsSnapshot.exists()) {
        transactionsSnapshot.forEach(childSnapshot => {
          const tx = childSnapshot.val() as Transaction;
          updates[`${basePath}/transactions/${childSnapshot.key}`] = null;
          if (tx.type === 'income') {
            currentSummaryData.totalIncome -= tx.amount;
          } else {
            currentSummaryData.totalExpenses -= tx.amount;
          }
        });
      }
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
      toast({ title: "Category Deleted", description: "Category and associated data deleted, summary updated." });
    } catch (error) {
      console.error("Error deleting category and associated data from RTDB:", error);
      toast({ title: "Error", description: "Could not delete category.", variant: "destructive" });
    }
  };
  
  const addBudgetGoal = async (budgetGoalData: Omit<BudgetGoal, 'id'>): Promise<BudgetGoal | undefined> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return undefined;
    }
    try {
      const budgetGoalsPath = `users/${user.uid}/budgetGoals`;
      const newItemRef = push(ref(rtdb, budgetGoalsPath));
      const newBudgetGoal = { id: newItemRef.key as string, ...budgetGoalData };
      await set(newItemRef, budgetGoalData);
      return newBudgetGoal;
    } catch (error) {
      console.error("Error adding budget goal:", error);
      toast({ title: "Error", description: "Could not add budget goal.", variant: "destructive" });
      return undefined;
    }
  };
  const updateBudgetGoal = async (updatedBudgetGoal: BudgetGoal): Promise<void> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const { id, ...dataToUpdate } = updatedBudgetGoal;
      const itemRef = ref(rtdb, `users/${user.uid}/budgetGoals/${id}`);
      await set(itemRef, dataToUpdate);
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
