"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import type { BudgetGoal } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const budgetFormSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  period: z.enum(['monthly', 'yearly']),
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;

interface BudgetFormProps {
  onSubmitSuccess?: (budget: BudgetGoal) => void;
  initialData?: BudgetGoal | null;
  onCancel?: () => void;
}

export function BudgetForm({ onSubmitSuccess, initialData, onCancel }: BudgetFormProps) {
  const { categories, addBudgetGoal, updateBudgetGoal } = useData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, register, formState: { errors }, reset } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: initialData || { categoryId: '', amount: 0, period: 'monthly' },
  });

  const onSubmit = (data: BudgetFormData) => {
    setIsSubmitting(true);
    try {
      let newOrUpdatedBudget;
      if (initialData) {
        newOrUpdatedBudget = { ...initialData, ...data };
        updateBudgetGoal(newOrUpdatedBudget);
        toast({ title: "Budget Updated", description: "Your budget goal has been updated." });
      } else {
        newOrUpdatedBudget = addBudgetGoal(data);
        toast({ title: "Budget Added", description: "Your budget goal has been added." });
      }
      reset();
      onSubmitSuccess?.(newOrUpdatedBudget);
    } catch (error) {
      toast({ title: "Error", description: "Could not save budget goal.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="categoryId" className="font-body">Category</Label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="categoryId" aria-invalid={errors.categoryId ? "true" : "false"} className="font-body">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(c => c.name.toLowerCase() !== 'salary').map((category) => ( // Exclude income categories like 'Salary'
                  <SelectItem key={category.id} value={category.id} className="font-body">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoryId && <p className="text-sm text-destructive font-body">{errors.categoryId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount" className="font-body">Budget Amount</Label>
        <Input id="amount" type="number" step="0.01" {...register('amount')} aria-invalid={errors.amount ? "true" : "false"} className="font-body"/>
        {errors.amount && <p className="text-sm text-destructive font-body">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="period" className="font-body">Period</Label>
        <Controller
          name="period"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="period" className="font-body">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly" className="font-body">Monthly</SelectItem>
                <SelectItem value="yearly" className="font-body">Yearly</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.period && <p className="text-sm text-destructive font-body">{errors.period.message}</p>}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="font-body">Cancel</Button>}
        <Button type="submit" disabled={isSubmitting} className="font-body">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Budget' : 'Set Budget'}
        </Button>
      </div>
    </form>
  );
}
