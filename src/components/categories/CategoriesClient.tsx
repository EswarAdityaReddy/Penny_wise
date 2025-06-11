"use client";

import React, { useState } from 'react';
import { CategoryForm } from './CategoryForm';
import { CategoryList } from './CategoryList';
import { useData } from '@/contexts/DataContext';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CategoriesClient() {
  const { categories } = useData();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  }

  const handleFormSubmitSuccess = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="font-body">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
               <CategoryForm 
                initialData={editingCategory} 
                onSubmitSuccess={handleFormSubmitSuccess} 
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <CategoryList categories={categories} onEdit={handleEdit} />
    </div>
  );
}
