
"use client";

import React, { useState } from 'react';
import { BudgetForm } from './BudgetForm';
import { BudgetList } from './BudgetList';
import { useData } from '@/contexts/DataContext';
import type { BudgetGoal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BudgetsClient() {
  const { budgetGoals } = useData();
  const [editingBudget, setEditingBudget] = useState<Omit<BudgetGoal, 'spentAmount'> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (budget: Omit<BudgetGoal, 'spentAmount'>) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingBudget(null);
    setIsFormOpen(true);
  };
  
  const handleFormSubmitSuccess = () => {
    setIsFormOpen(false);
    setEditingBudget(null);
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingBudget(null); // Clear editing state when dialog closes
    }
    setIsFormOpen(open);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isFormOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="font-body">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Budget Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">{editingBudget ? 'Edit Budget Goal' : 'Add New Budget Goal'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <BudgetForm 
                initialData={editingBudget} 
                onSubmitSuccess={handleFormSubmitSuccess} 
                onCancel={() => handleDialogClose(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <BudgetList budgetGoals={budgetGoals} onEdit={handleEdit} />
    </div>
  );
}
