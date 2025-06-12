
"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import type { Transaction } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/components/dashboard/MetricCard'; // Reusing formatter
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


interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
}

export function TransactionTable({ transactions, onEdit }: TransactionTableProps) {
  const { getCategoryNameById, deleteTransaction } = useData();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [transactionToDelete, setTransactionToDelete] = React.useState<Transaction | null>(null);


  const handleDeleteInitiated = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirmed = async () => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete); 
      toast({ title: "Transaction Deleted", description: `Transaction "${transactionToDelete.description}" has been deleted and summary updated.` });
      setTransactionToDelete(null);
    }
    setShowDeleteDialog(false);
  };

  if (transactions.length === 0) {
    return <p className="text-muted-foreground text-center py-8 font-body">No transactions yet. Add one to get started!</p>;
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Date</TableHead>
              <TableHead className="font-body">Description</TableHead>
              <TableHead className="font-body">Category</TableHead>
              <TableHead className="font-body text-right">Amount</TableHead>
              <TableHead className="font-body text-right">Type</TableHead>
              <TableHead className="w-[50px] font-body">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-body">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium font-body">{transaction.description}</TableCell>
                <TableCell className="font-body">{getCategoryNameById(transaction.categoryId)}</TableCell>
                <TableCell className="text-right font-body">{formatCurrency(transaction.amount)}</TableCell>
                <TableCell className="text-right font-body">
                  <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}
                    className={transaction.type === 'income' ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-800 dark:text-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-200'}
                  >
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(transaction)} className="font-body">
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteInitiated(transaction)} className="text-destructive focus:text-destructive focus:bg-destructive/10 font-body">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              This action cannot be undone. This will permanently delete the transaction
              "{transactionToDelete?.description}".
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
