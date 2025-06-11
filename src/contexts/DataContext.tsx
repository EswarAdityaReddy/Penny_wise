// src/contexts/DataContext.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Transaction, Category, BudgetGoal } from '@/lib/types';
import { initialCategories, initialTransactions, initialBudgetGoals } from '@/lib/mock-data';

interface DataContextProps {
  transactions: Transaction[];
  categories: Category[];
  budgetGoals: BudgetGoal[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  addBudgetGoal: (budgetGoal: Omit<BudgetGoal, 'id'>) => BudgetGoal;
  updateBudgetGoal: (budgetGoal: BudgetGoal) => void;
  deleteBudgetGoal: (budgetGoalId: string) => void;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryNameById: (id: string) => string;
  getTransactionsByCategory: (categoryId: string) => Transaction[];
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>(initialBudgetGoals);

  // Load from localStorage (optional persistence)
  useEffect(() => {
    try {
      const storedTransactions = localStorage.getItem('pennywise_transactions');
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
      
      const storedCategories = localStorage.getItem('pennywise_categories');
      if (storedCategories) setCategories(JSON.parse(storedCategories));
      
      const storedBudgetGoals = localStorage.getItem('pennywise_budgetgoals');
      if (storedBudgetGoals) setBudgetGoals(JSON.parse(storedBudgetGoals));
    } catch (error) {
      console.warn("Could not load data from localStorage", error);
      // Fallback to initial mock data if parsing fails or localStorage is unavailable
      setTransactions(initialTransactions);
      setCategories(initialCategories);
      setBudgetGoals(initialBudgetGoals);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pennywise_transactions', JSON.stringify(transactions));
    } catch (error) {
      console.warn("Could not save transactions to localStorage", error);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('pennywise_categories', JSON.stringify(categories));
    } catch (error) {
      console.warn("Could not save categories to localStorage", error);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('pennywise_budgetgoals', JSON.stringify(budgetGoals));
    } catch (error) {
      console.warn("Could not save budget goals to localStorage", error);
    }
  }, [budgetGoals]);


  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: crypto.randomUUID() };
    setTransactions(prev => [...prev, newTransaction]);
    return newTransaction;
  }, []);

  const updateTransaction = useCallback((updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  }, []);

  const deleteTransaction = useCallback((transactionId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  }, []);

  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: crypto.randomUUID() };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, []);

  const updateCategory = useCallback((updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  }, []);

  const deleteCategory = useCallback((categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    setTransactions(prev => prev.filter(t => t.categoryId !== categoryId)); // Also remove associated transactions or reassign
    setBudgetGoals(prev => prev.filter(b => b.categoryId !== categoryId)); // Remove associated budgets
  }, []);
  
  const addBudgetGoal = useCallback((budgetGoal: Omit<BudgetGoal, 'id'>) => {
    const newBudgetGoal = { ...budgetGoal, id: crypto.randomUUID() };
    setBudgetGoals(prev => [...prev, newBudgetGoal]);
    return newBudgetGoal;
  }, []);

  const updateBudgetGoal = useCallback((updatedBudgetGoal: BudgetGoal) => {
    setBudgetGoals(prev => prev.map(b => b.id === updatedBudgetGoal.id ? updatedBudgetGoal : b));
  }, []);

  const deleteBudgetGoal = useCallback((budgetGoalId: string) => {
    setBudgetGoals(prev => prev.filter(b => b.id !== budgetGoalId));
  }, []);

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
      transactions, categories, budgetGoals, 
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
