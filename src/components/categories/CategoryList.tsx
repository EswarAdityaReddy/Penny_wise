"use client";

import React from 'react';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useData } from '@/contexts/DataContext';
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

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
}

export function CategoryList({ categories, onEdit }: CategoryListProps) {
  const { deleteCategory } = useData();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);

  const handleDeleteInitiated = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirmed = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      toast({ title: "Category Deleted", description: `Category "${categoryToDelete.name}" has been deleted.` });
      setCategoryToDelete(null);
    }
    setShowDeleteDialog(false);
  };
  
  if (categories.length === 0) {
    return <p className="text-muted-foreground text-center py-8 font-body">No categories yet. Add one to get started!</p>;
  }

  return (
    <>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => {
        const IconComponent = LucideIcons[category.icon as keyof typeof LucideIcons.icons] as React.ElementType || LucideIcons.Tag;
        return (
          <Card key={category.id} className="shadow hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium font-body flex items-center gap-2">
                <IconComponent className="h-5 w-5" style={{ color: category.color }} />
                {category.name}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(category)}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteInitiated(category)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </CardHeader>
            {/* Can add more details like number of transactions or budget info here in CardContent if needed */}
            {/* <CardContent>
              <p className="text-xs text-muted-foreground">Optional: details about category</p>
            </CardContent> */}
          </Card>
        );
      })}
    </div>
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline">Are you sure?</AlertDialogTitle>
          <AlertDialogDescription className="font-body">
            This action cannot be undone. This will permanently delete the category
            "{categoryToDelete?.name}" and all associated transactions and budgets.
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
