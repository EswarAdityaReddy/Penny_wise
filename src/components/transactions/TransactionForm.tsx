
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '@/contexts/DataContext';
import type { Transaction } from '@/lib/types';
import { suggestTransactionCategories } from '@/ai/flows/suggest-transaction-categories';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const transactionFormSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  date: z.date(),
  categoryId: z.string().min(1, 'Category is required'),
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  onSubmitSuccess?: (transaction: Transaction) => void;
  initialData?: Transaction | null;
}

export function TransactionForm({ onSubmitSuccess, initialData }: TransactionFormProps) {
  const { categories, addTransaction, updateTransaction, transactions } = useData(); // Added transactions to get original for update
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedAITags, setSuggestedAITags] = useState<string[]>([]);
  
  // Store original transaction data for updates
  const [originalTransactionForUpdate, setOriginalTransactionForUpdate] = useState<Transaction | null>(null);


  const defaultValues = initialData ? {
    ...initialData,
    amount: Math.abs(initialData.amount), 
    date: new Date(initialData.date),
  } : {
    description: '',
    amount: 0,
    type: 'expense' as 'expense' | 'income',
    date: new Date(),
    categoryId: '',
  };
  
  const { control, handleSubmit, register, formState: { errors }, setValue, watch, reset } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (initialData) {
      // Find the full original transaction from context if initialData (which might be partial) is provided
      const fullInitial = transactions.find(t => t.id === initialData.id) || initialData;
      setOriginalTransactionForUpdate(fullInitial);
      // Reset form with potentially fuller initialData from context
      reset({
        ...fullInitial,
        amount: Math.abs(fullInitial.amount),
        date: new Date(fullInitial.date),
      });
    } else {
      setOriginalTransactionForUpdate(null);
      reset(defaultValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, transactions, reset]);


  const descriptionValue = watch("description");

  const handleAISuggestions = async () => {
    if (!descriptionValue) {
      toast({ title: "Description needed", description: "Please enter a transaction description to get AI suggestions.", variant: "destructive" });
      return;
    }
    setIsSuggesting(true);
    setSuggestedAITags([]);
    try {
      const result = await suggestTransactionCategories({ transactionDescription: descriptionValue });
      if (result.suggestedCategories && result.suggestedCategories.length > 0) {
        setSuggestedAITags(result.suggestedCategories);
        const matchedCategory = categories.find(cat => 
          result.suggestedCategories.some(sug => sug.toLowerCase() === cat.name.toLowerCase())
        );
        if (matchedCategory) {
          setValue('categoryId', matchedCategory.id, { shouldValidate: true });
        }
        toast({ title: "Categories Suggested!", description: "AI has suggested some categories for you."});
      } else {
        toast({ title: "No specific suggestions", description: "AI couldn't pinpoint specific categories. Please select manually."});
      }
    } catch (error) {
      console.error("AI Suggestion Error:", error);
      toast({ title: "AI Suggestion Failed", description: "Could not get AI category suggestions at this time.", variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    const transactionPayload = {
      ...data,
      date: data.date.toISOString(),
    };

    try {
      let newOrUpdatedTransaction;
      if (initialData && originalTransactionForUpdate) {
        newOrUpdatedTransaction = { ...originalTransactionForUpdate, ...transactionPayload, id: initialData.id };
        await updateTransaction(newOrUpdatedTransaction, originalTransactionForUpdate);
        toast({ title: "Transaction Updated", description: "Your transaction has been successfully updated and summary refreshed." });
      } else {
        const addedTx = await addTransaction(transactionPayload);
        if (addedTx) {
          newOrUpdatedTransaction = addedTx;
          toast({ title: "Transaction Added", description: "Your transaction has been successfully added and summary refreshed." });
        } else {
           throw new Error("Failed to add transaction");
        }
      }
      
      reset(defaultValues); 
      setSuggestedAITags([]);
      setOriginalTransactionForUpdate(null); // Clear original transaction after submission
      if (newOrUpdatedTransaction) {
        onSubmitSuccess?.(newOrUpdatedTransaction);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({ title: "Submission Failed", description: "There was an error saving your transaction.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{initialData ? 'Edit Transaction' : 'Add New Transaction'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="font-body">Description</Label>
              <div className="flex items-center gap-2">
                <Input id="description" {...register('description')} aria-invalid={errors.description ? "true" : "false"} className="font-body"/>
                <Button type="button" onClick={handleAISuggestions} disabled={isSuggesting || !descriptionValue} size="sm" variant="outline">
                  {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">Suggest</span>
                </Button>
              </div>
              {errors.description && <p className="text-sm text-destructive font-body">{errors.description.message}</p>}
              {suggestedAITags.length > 0 && (
                <div className="mt-2 space-x-2">
                  <span className="text-xs text-muted-foreground font-body">AI Suggestions:</span>
                  {suggestedAITags.map(tag => (
                    <Button 
                      key={tag} 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="text-xs px-2 py-1 h-auto font-body"
                      onClick={() => {
                        const matchedCategory = categories.find(cat => cat.name.toLowerCase() === tag.toLowerCase());
                        if (matchedCategory) setValue('categoryId', matchedCategory.id, { shouldValidate: true });
                        else toast({ title: "Category not found", description: `"${tag}" is not an existing category. You can add it or choose another.`})
                      }}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="font-body">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...register('amount')} aria-invalid={errors.amount ? "true" : "false"} className="font-body"/>
              {errors.amount && <p className="text-sm text-destructive font-body">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="font-body">Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4 pt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="expense" id="expense" />
                      <Label htmlFor="expense" className="font-body">Expense</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="income" id="income" />
                      <Label htmlFor="income" className="font-body">Income</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {errors.type && <p className="text-sm text-destructive font-body">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="font-body">Date</Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal font-body ${!field.value && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && <p className="text-sm text-destructive font-body">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId" className="font-body">Category</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <SelectTrigger id="categoryId" aria-invalid={errors.categoryId ? "true" : "false"} className="font-body">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
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
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto font-body">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {initialData ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

