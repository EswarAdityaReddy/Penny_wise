
// src/contexts/DataContext.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Transaction, Category, BudgetGoal } from '@/lib/types';
import { initialCategories as defaultCategoriesSeed } from '@/lib/mock-data'; // Renamed for clarity
import { useAuthContext } from './AuthContext';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  writeBatch,
  getDocs
} from 'firebase/firestore';
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

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const seedDefaultCategories = useCallback(async (userId: string) => {
    const batch = writeBatch(db);
    const categoriesColRef = collection(db, 'users', userId, 'categories');
    
    // Check if categories already exist to prevent re-seeding (simple check)
    const existingCategoriesSnap = await getDocs(categoriesColRef);
    if (!existingCategoriesSnap.empty) {
      // console.log("Categories already exist, skipping seed.");
      return;
    }

    defaultCategoriesSeed.forEach(category => {
      // For seeding, we might not have a Firestore ID yet, so we let Firestore generate it
      // or use a predefined ID if your seed data has them and you want consistency.
      // For this example, letting Firestore generate IDs by not specifying doc() path
      const docRef = doc(categoriesColRef); // Firestore will generate ID
      batch.set(docRef, { name: category.name, icon: category.icon, color: category.color });
    });
    try {
      await batch.commit();
      // console.log("Default categories seeded for user:", userId);
    } catch (error) {
      console.error("Error seeding default categories:", error);
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

    // Seed categories if it's potentially a new user or they have no categories
    // This is a simple check; more robust new user detection might be needed
    const categoriesColRef = collection(db, 'users', userId, 'categories');
    getDocs(categoriesColRef).then(snapshot => {
      if (snapshot.empty) {
        seedDefaultCategories(userId);
      }
    });

    const unsubCategories = onSnapshot(collection(db, 'users', userId, 'categories'), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
      setLoadingData(false);
    }, (error) => {
      console.error("Error fetching categories:", error);
      toast({ title: "Data Error", description: "Could not load categories.", variant: "destructive" });
      setLoadingData(false);
    });

    const unsubTransactions = onSnapshot(collection(db, 'users', userId, 'transactions'), (snapshot) => {
      const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(trans);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      toast({ title: "Data Error", description: "Could not load transactions.", variant: "destructive" });
    });

    const unsubBudgetGoals = onSnapshot(collection(db, 'users', userId, 'budgetGoals'), (snapshot) => {
      const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetGoal));
      setBudgetGoals(goals);
    }, (error) => {
      console.error("Error fetching budget goals:", error);
      toast({ title: "Data Error", description: "Could not load budget goals.", variant: "destructive" });
    });

    return () => {
      unsubCategories();
      unsubTransactions();
      unsubBudgetGoals();
    };
  }, [user, toast, seedDefaultCategories]);


  const addOperation = async <T extends { id: string }, OmitId>(
    colName: string, 
    data: OmitId
  ): Promise<T | undefined> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return undefined;
    }
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, colName), data);
      return { id: docRef.id, ...data } as T;
    } catch (error) {
      console.error(`Error adding ${colName}:`, error);
      toast({ title: "Error", description: `Could not add ${colName.slice(0, -1)}.`, variant: "destructive" });
      return undefined;
    }
  };

  const updateOperation = async <T extends { id: string }>(
    colName: string, 
    data: T
  ): Promise<void> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const { id, ...dataToUpdate } = data;
      await setDoc(doc(db, 'users', user.uid, colName, id), dataToUpdate, { merge: true });
    } catch (error) {
      console.error(`Error updating ${colName}:`, error);
      toast({ title: "Error", description: `Could not update ${colName.slice(0, -1)}.`, variant: "destructive" });
    }
  };

  const deleteOperation = async (colName: string, docId: string): Promise<void> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, colName, docId));
    } catch (error) {
      console.error(`Error deleting ${colName}:`, error);
      toast({ title: "Error", description: `Could not delete ${colName.slice(0, -1)}.`, variant: "destructive" });
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
      toast({ title: "Authentication Error", description: "You must be logged in to delete a category.", variant: "destructive" });
      return;
    }
    try {
      const batch = writeBatch(db);
      // Delete the category itself
      const categoryDocRef = doc(db, 'users', user.uid, 'categories', categoryId);
      batch.delete(categoryDocRef);

      // Query and delete associated transactions
      const transactionsQuery = query(collection(db, 'users', user.uid, 'transactions'), where('categoryId', '==', categoryId));
      const transactionsSnap = await getDocs(transactionsQuery);
      transactionsSnap.forEach(doc => batch.delete(doc.ref));

      // Query and delete associated budget goals
      const budgetGoalsQuery = query(collection(db, 'users', user.uid, 'budgetGoals'), where('categoryId', '==', categoryId));
      const budgetGoalsSnap = await getDocs(budgetGoalsQuery);
      budgetGoalsSnap.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
      toast({ title: "Category Deleted", description: "Category and associated data deleted." });
    } catch (error) {
      console.error("Error deleting category and associated data:", error);
      toast({ title: "Error", description: "Could not delete category.", variant: "destructive" });
    }
  };
  
  // Budget Goals
  const addBudgetGoal = (budgetGoal: Omit<BudgetGoal, 'id'>) => addOperation<BudgetGoal, Omit<BudgetGoal, 'id'>>('budgetGoals', budgetGoal);
  const updateBudgetGoal = (updatedBudgetGoal: BudgetGoal) => updateOperation<BudgetGoal>('budgetGoals', updatedBudgetGoal);
  const deleteBudgetGoal = (budgetGoalId: string) => deleteOperation('budgetGoals', budgetGoalId);

  // Getter functions (operate on local state, which is kept in sync by onSnapshot)
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

    