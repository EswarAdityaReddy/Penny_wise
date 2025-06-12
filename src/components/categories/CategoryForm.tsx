
"use client";

import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useData } from '@/contexts/DataContext';
import type { Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import * as LucideIcons from 'lucide-react'; // Import all icons

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().min(1, 'Icon is required'), // Store as string (icon name)
  color: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  onSubmitSuccess?: (category: Category) => void;
  initialData?: Category | null;
  onCancel?: () => void;
}

export function CategoryForm({ onSubmitSuccess, initialData, onCancel }: CategoryFormProps) {
  const { addCategory, updateCategory } = useData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formDefaultValues = initialData || { name: '', icon: 'Tag', color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)` };

  const { control, handleSubmit, register, formState: { errors }, reset } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: formDefaultValues,
  });

  const iconNames = useMemo(() => {
    if (!LucideIcons || typeof LucideIcons !== 'object') {
      console.error("LucideIcons namespace is not available or not an object.", LucideIcons);
      return [];
    }
    try {
      const keys = Object.keys(LucideIcons);
      const filteredKeys = keys.filter(key => {
        const exportValue = LucideIcons[key as keyof typeof LucideIcons];
        // Icon components are functions, typically start with an uppercase letter,
        // and we exclude known non-icon exports.
        return typeof exportValue === 'function' &&
               /^[A-Z]/.test(key) && // Icon names start with an uppercase letter
               key !== 'createLucideIcon' && // Utility function
               key !== 'IconNode' && // Internal type/class
               key !== 'createElement' && // React's createElement, sometimes re-exported
               key !== 'default'; // 'default' is the Module object itself under `import *`
               // 'icons' (the object map) is not a function component itself.
      });
      return filteredKeys;
    } catch (error) {
      console.error("Error generating icon list in CategoryForm:", error);
      return [];
    }
  }, []);


  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    let newOrUpdatedCategory: Category | undefined = undefined;
    try {
      if (initialData) {
        const categoryToUpdate = { ...initialData, ...data };
        await updateCategory(categoryToUpdate);
        newOrUpdatedCategory = categoryToUpdate;
        toast({ title: "Category Updated", description: `Category "${data.name}" has been updated.` });
      } else {
        const addedCategory = await addCategory(data);
        if (addedCategory) {
          newOrUpdatedCategory = addedCategory;
          toast({ title: "Category Added", description: `Category "${data.name}" has been added.` });
        }
      }
      
      reset(formDefaultValues); 
      
      if (onSubmitSuccess && newOrUpdatedCategory) {
        onSubmitSuccess(newOrUpdatedCategory);
      }

    } catch (error) {
      console.error("Category form submission error:", error);
      toast({ title: "Error", description: "Could not save category. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="font-body">Category Name</Label>
        <Input id="name" {...register('name')} aria-invalid={errors.name ? "true" : "false"} className="font-body"/>
        {errors.name && <p className="text-sm text-destructive font-body">{errors.name.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="icon" className="font-body">Icon</Label>
        <Controller
          name="icon"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="icon" className="font-body">
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {(iconNames || []).map(iconName => { // Guard with (iconNames || [])
                  const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
                  if (!IconComponent || typeof IconComponent !== 'function') return null; // Ensure IconComponent is valid
                  return (
                    <SelectItem key={iconName} value={iconName} className="font-body">
                      <div className="flex items-center">
                        <IconComponent className="mr-2 h-4 w-4" />
                        {iconName}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        />
        {errors.icon && <p className="text-sm text-destructive font-body">{errors.icon.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="color" className="font-body">Color</Label>
        <Controller
            name="color"
            control={control}
            defaultValue={formDefaultValues.color}
            render={({ field }) => (
                <Input 
                    id="color" 
                    type="color" 
                    value={field.value || ''} // Ensure value is not undefined for input type color
                    onChange={field.onChange} 
                    className="font-body w-full h-10 p-1"
                />
            )}
        />
        {errors.color && <p className="text-sm text-destructive font-body">{errors.color.message}</p>}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && <Button type="button" variant="outline" onClick={() => { reset(formDefaultValues); onCancel();}} disabled={isSubmitting} className="font-body">Cancel</Button>}
        <Button type="submit" disabled={isSubmitting} className="font-body">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Category' : 'Add Category'}
        </Button>
      </div>
    </form>
  );
}
