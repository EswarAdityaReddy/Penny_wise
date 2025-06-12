
// src/contexts/DataContext.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Transaction, Category, BudgetGoal } from '@/lib/types';
import { initialCategories as defaultCategoriesSeed } from '@/lib/mock-data';
import { useAuthContext } from './AuthContext';
import { rtdb } from '@/lib/firebase/config'; // Changed to RTDB
import { 
  ref, 
  onValue, 
  set, 
  remove, 
  push, 
  get, 
  child,
  update,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

interface DataContextProps {
  transactions: Transaction[];
  categories: Category[];
  budgetGoals: BudgetGoal[];
  loadingData: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<Transaction | undefined>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
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

// Helper to convert RTDB object to array
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
  const [loadingData, setLoadingData] = useState(true);

  const seedDefaultCategories = useCallback(async (userId: string) => {
    const categoriesPath = `users/${userId}/categories`;
    const categoriesRef = ref(rtdb, categoriesPath);
    
    try {
      const snapshot = await get(categoriesRef);
      if (!snapshot.exists() || !snapshot.val()) { // Check if categories path is empty or non-existent
        const updates: Record<string, any> = {};
        defaultCategoriesSeed.forEach(category => {
          // Use predefined IDs from seed data for consistency
          updates[`${categoriesPath}/${category.id}`] = { 
            name: category.name, 
            icon: category.icon, 
            color: category.color 
          };
        });
        await update(ref(rtdb), updates);
        // console.log("Default categories seeded for user in RTDB:", userId);
      }
    } catch (error) {
      console.error("Error seeding default categories in RTDB:", error);
      toast({ title: "Setup Error", description: "Could not set up default categories.", variant: "destructive" });
    }
  }, [toast]);


  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCategories([]);
      setBudgetGoals([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    const userId = user.uid;

    seedDefaultCategories(userId); // Attempt to seed categories

    const categoriesRef = ref(rtdb, `users/${userId}/categories`);
    const unsubCategories = onValue(categoriesRef, (snapshot) => {
      setCategories(rtdbObjectToArray<Category>(snapshot.val()));
      setLoadingData(false); // Consider all initial data loaded after categories
    }, (error) => {
      console.error("Error fetching categories from RTDB:", error);
      toast({ title: "Data Error", description: "Could not load categories.", variant: "destructive" });
      setLoadingData(false);
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

    return () => {
      unsubCategories();
      unsubTransactions();
      unsubBudgetGoals();
    };
  }, [user, toast, seedDefaultCategories]);


  const addOperation = async <T extends { id: string }, OmitId>(
    entityPath: string, // e.g., 'transactions', 'categories'
    data: OmitId
  ): Promise<T | undefined> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return undefined;
    }
    try {
      const listRef = ref(rtdb, `users/${user.uid}/${entityPath}`);
      const newItemRef = push(listRef); // Firebase generates a unique key
      await set(newItemRef, data);
      return { id: newItemRef.key as string, ...data } as T;
    } catch (error) {
      console.error(`Error adding ${entityPath}:`, error);
      toast({ title: "Error", description: `Could not add ${entityPath.slice(0, -1)}.`, variant: "destructive" });
      return undefined;
    }
  };

  const updateOperation = async <T extends { id: string }>(
    entityPath: string, 
    data: T
  ): Promise<void> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const { id, ...dataToUpdate } = data;
      const itemRef = ref(rtdb, `users/${user.uid}/${entityPath}/${id}`);
      await set(itemRef, dataToUpdate); // `set` overwrites data at the specified location
    } catch (error) {
      console.error(`Error updating ${entityPath}:`, error);
      toast({ title: "Error", description: `Could not update ${entityPath.slice(0, -1)}.`, variant: "destructive" });
    }
  };

  const deleteOperation = async (entityPath: string, docId: string): Promise<void> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const itemRef = ref(rtdb, `users/${user.uid}/${entityPath}/${docId}`);
      await remove(itemRef);
    } catch (error) {
      console.error(`Error deleting ${entityPath}:`, error);
      toast({ title: "Error", description: `Could not delete ${entityPath.slice(0, -1)}.`, variant: "destructive" });
    }
  };

  // Transactions
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => addOperation<Transaction, Omit<Transaction, 'id'>>('transactions', transaction);
  const updateTransaction = (updatedTransaction: Transaction) => updateOperation<Transaction>('transactions', updatedTransaction);
  const deleteTransaction = (transactionId: string) => deleteOperation('transactions', transactionId);

  // Categories
  const addCategory = (category: Omit<Category, 'id'>) => addOperation<Category, Omit<Category, 'id'>>('categories', category);
  const updateCategory = (updatedCategory: Category) => updateOperation<Category>('categories', updatedCategory);
  
  const deleteCategory = async (categoryId: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const basePath = `users/${user.uid}`;
      const updates: Record<string, null> = {};
      
      // Mark category for deletion
      updates[`${basePath}/categories/${categoryId}`] = null;

      // Find and mark related transactions for deletion
      const transactionsRef = query(ref(rtdb, `${basePath}/transactions`), orderByChild('categoryId'), equalTo(categoryId));
      const transactionsSnapshot = await get(transactionsRef);
      if (transactionsSnapshot.exists()) {
        transactionsSnapshot.forEach(childSnapshot => {
          updates[`${basePath}/transactions/${childSnapshot.key}`] = null;
        });
      }

      // Find and mark related budget goals for deletion
      const budgetGoalsRef = query(ref(rtdb, `${basePath}/budgetGoals`), orderByChild('categoryId'), equalTo(categoryId));
      const budgetGoalsSnapshot = await get(budgetGoalsRef);
      if (budgetGoalsSnapshot.exists()) {
        budgetGoalsSnapshot.forEach(childSnapshot => {
          updates[`${basePath}/budgetGoals/${childSnapshot.key}`] = null;
        });
      }
      
      await update(ref(rtdb), updates); // Perform multi-path delete
      toast({ title: "Category Deleted", description: "Category and associated data deleted." });
    } catch (error) {
      console.error("Error deleting category and associated data from RTDB:", error);
      toast({ title: "Error", description: "Could not delete category.", variant: "destructive" });
    }
  };
  
  // Budget Goals
  const addBudgetGoal = (budgetGoal: Omit<BudgetGoal, 'id'>) => addOperation<BudgetGoal, Omit<BudgetGoal, 'id'>>('budgetGoals', budgetGoal);
  const updateBudgetGoal = (updatedBudgetGoal: BudgetGoal) => updateOperation<BudgetGoal>('budgetGoals', updatedBudgetGoal);
  const deleteBudgetGoal = (budgetGoalId: string) => deleteOperation('budgetGoals', budgetGoalId);

  // Getter functions (operate on local state, which is kept in sync by onValue)
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
      transactions, categories, budgetGoals, loadingData,
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
