"use client";

import React from 'react';
import type { BudgetGoal } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { formatCurrency } from '@/components/dashboard/MetricCard';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BudgetListProps {
  budgetGoals: BudgetGoal[];
  onEdit: (budgetGoal: BudgetGoal) => void;
}

export function BudgetList({ budgetGoals, onEdit }: BudgetListProps) {
  const { getCategoryById, getTransactionsByCategory, deleteBudgetGoal } = useData();
  const { toast } = useToast();

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [budgetToDelete, setBudgetToDelete] = React.useState<BudgetGoal | null>(null);

  const handleDeleteInitiated = (budget: BudgetGoal) => {
    setBudgetToDelete(budget);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirmed = () => {
    if (budgetToDelete) {
      deleteBudgetGoal(budgetToDelete.id);
      const categoryName = getCategoryById(budgetToDelete.categoryId)?.name || "Budget";
      toast({ title: "Budget Deleted", description: `${categoryName} budget has been deleted.` });
      setBudgetToDelete(null);
    }
    setShowDeleteDialog(false);
  };

  if (budgetGoals.length === 0) {
    return <p className="text-muted-foreground text-center py-8 font-body">No budget goals set yet. Add one to get started!</p>;
  }

  return (
    <>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {budgetGoals.map((goal) => {
        const category = getCategoryById(goal.categoryId);
        if (!category) return null;

        const spent = getTransactionsByCategory(goal.categoryId)
          .filter(tx => {
            // Basic filtering for monthly, can be expanded for yearly
            if (goal.period === 'monthly') {
              const txDate = new Date(tx.date);
              const today = new Date();
              return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
            }
            return true; // For yearly, include all for now
          })
          .reduce((sum, t) => sum + t.amount, 0);
        
        const progress = goal.amount > 0 ? Math.min((spent / goal.amount) * 100, 100) : 0;
        const remaining = goal.amount - spent;
        const IconComponent = LucideIcons[category.icon as keyof typeof LucideIcons.icons] as React.ElementType || LucideIcons.Tag;

        return (
          <Card key={goal.id} className="shadow hover:shadow-md transition-shadow flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-headline text-lg flex items-center gap-2">
                     <IconComponent className="h-5 w-5" style={{color: category.color}}/>
                    {category.name}
                  </CardTitle>
                  <CardDescription className="font-body">{goal.period.charAt(0).toUpperCase() + goal.period.slice(1)} Budget: {formatCurrency(goal.amount)}</CardDescription>
                </div>
                 <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(goal)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteInitiated(goal)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <div>
                <div className="flex justify-between text-sm mb-1 font-body">
                  <span>Spent: {formatCurrency(spent)}</span>
                  <span className={remaining < 0 ? 'text-destructive' : 'text-green-600'}>
                    {remaining < 0 ? `Over: ${formatCurrency(Math.abs(remaining))}` : `Left: ${formatCurrency(remaining)}`}
                  </span>
                </div>
                <Progress value={progress} className="h-3 [&>div]:bg-primary" />
                <p className="text-xs text-muted-foreground mt-1 font-body">{progress.toFixed(0)}% used</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline">Are you sure?</AlertDialogTitle>
          <AlertDialogDescription className="font-body">
            This action cannot be undone. This will permanently delete the budget goal for 
            "{getCategoryById(budgetToDelete?.categoryId || '')?.name}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-body">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
