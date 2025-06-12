
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

// Form data doesn't include spentAmount, it's calculated by DataContext
type BudgetFormData = z.infer<typeof budgetFormSchema>; 

interface BudgetFormProps {
  onSubmitSuccess?: (budget: BudgetGoal) => void; // BudgetGoal includes spentAmount
  initialData?: Omit<BudgetGoal, 'spentAmount'> | null; // Form receives data without spentAmount
  onCancel?: () => void;
}

export function BudgetForm({ onSubmitSuccess, initialData, onCancel }: BudgetFormProps) {
  const { categories, addBudgetGoal, updateBudgetGoal } = useData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultFormValues: BudgetFormData = initialData 
    ? { categoryId: initialData.categoryId, amount: initialData.amount, period: initialData.period } 
    : { categoryId: '', amount: 0, period: 'monthly' };

  const { control, handleSubmit, register, formState: { errors }, reset } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmit = async (data: BudgetFormData) => {
    setIsSubmitting(true);
    try {
      let resultBudget;
      if (initialData) {
        // We need the ID for updating
        const budgetToUpdate: Omit<BudgetGoal, 'spentAmount'> = { ...initialData, ...data, id: initialData.id! };
        await updateBudgetGoal(budgetToUpdate); // updateBudgetGoal in context will handle spentAmount
        toast({ title: "Budget Updated", description: "Your budget goal has been updated." });
        // Assuming updateBudgetGoal somehow returns the full BudgetGoal or we fetch it
        // For now, we don't have the updated spentAmount here directly to pass to onSubmitSuccess
      } else {
        resultBudget = await addBudgetGoal(data); // addBudgetGoal in context calculates spentAmount
        toast({ title: "Budget Added", description: "Your budget goal has been added." });
      }
      reset(defaultFormValues);
      if (resultBudget && onSubmitSuccess) {
         onSubmitSuccess(resultBudget); // This would require addBudgetGoal to return the full BudgetGoal with ID and spentAmount
      } else if (onSubmitSuccess) {
        // If updating, we might need to refetch or assume context updates trigger parent re-render
        // For simplicity, onSubmitSuccess might not receive the budget goal on update here
        onSubmitSuccess(undefined as any); // Or handle differently
      }
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
                {categories.filter(c => c.name.toLowerCase() !== 'salary').map((category) => (
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
        {onCancel && <Button type="button" variant="outline" onClick={() => { reset(defaultFormValues); onCancel();}} disabled={isSubmitting} className="font-body">Cancel</Button>}
        <Button type="submit" disabled={isSubmitting} className="font-body">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Budget' : 'Set Budget'}
        </Button>
      </div>
    </form>
  );
}
