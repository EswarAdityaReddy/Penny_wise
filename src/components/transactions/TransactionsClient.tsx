"use client";

import React, { useState, useMemo } from 'react';
import { TransactionForm } from './TransactionForm';
import { TransactionTable } from './TransactionTable';
import { useData } from '@/contexts/DataContext';
import type { Transaction } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TransactionsClient() {
  const { transactions, categories } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);


  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || transaction.categoryId === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [sortedTransactions, searchTerm, filterCategory]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };
  
  const handleFormSubmitSuccess = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs font-body"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px] font-body">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-body">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id} className="font-body">
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="w-full md:w-auto font-body">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle className="font-headline">{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <TransactionForm 
                initialData={editingTransaction}
                onSubmitSuccess={handleFormSubmitSuccess} 
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <TransactionTable transactions={filteredTransactions} onEdit={handleEdit} />
    </div>
  );
}
