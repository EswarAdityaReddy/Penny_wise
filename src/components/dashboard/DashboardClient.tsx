
"use client";

import { useData } from "@/contexts/DataContext";
import { MetricCard, formatCurrency } from "./MetricCard";
import { SpendingPieChart } from "@/components/charts/SpendingPieChart";
import { DollarSign, TrendingDown, TrendingUp, Wallet, Loader2 } from "lucide-react";
import type { Category } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardClient() {
  const { transactions, categories, budgetGoals, getCategoryById, getTransactionsByCategory, summary, loadingData } = useData();

  // Values now come from summary in DataContext, which is synced with RTDB
  const totalIncome = summary.totalIncome;
  const totalExpenses = summary.totalExpenses;
  const balance = summary.currentBalance;

  const spendingByCategory = categories
    .map((category) => {
      const categoryExpenses = transactions
        .filter((t) => t.categoryId === category.id && t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: category.name,
        value: categoryExpenses,
        fill: category.color || `hsl(${Math.random() * 360}, 70%, 50%)`, // Fallback color
      };
    })
    .filter((item) => item.value > 0)
    .sort((a,b) => b.value - a.value);


  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 font-body text-lg">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard title="Total Income" value={totalIncome} icon={TrendingUp} className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700" />
      <MetricCard title="Total Expenses" value={totalExpenses} icon={TrendingDown} className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700" />
      <MetricCard title="Current Balance" value={balance} icon={Wallet} className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700" />

      <div className="lg:col-span-2">
        <SpendingPieChart data={spendingByCategory} title="Expense Distribution" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <ul className="space-y-3">
              {recentTransactions.map((tx) => (
                <li key={tx.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50">
                  <div>
                    <p className="font-medium font-body">{tx.description}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {getCategoryById(tx.categoryId)?.name || 'Uncategorized'} - {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`font-semibold font-body ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground font-body">No recent transactions.</p>
          )}
          <Link href="/transactions">
            <Button variant="link" className="mt-4 p-0 font-body">View all transactions</Button>
          </Link>
        </CardContent>
      </Card>

      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Budget Goals</CardTitle>
          </CardHeader>
          <CardContent>
            {budgetGoals.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgetGoals.map(goal => {
                const category = getCategoryById(goal.categoryId);
                if (!category) return null;
                const spent = getTransactionsByCategory(goal.categoryId).reduce((sum, t) => sum + t.amount, 0);
                const progress = goal.amount > 0 ? Math.min((spent / goal.amount) * 100, 100) : 0;
                return (
                  <div key={goal.id} className="p-4 border rounded-lg bg-card shadow">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium font-body">{category.name}</h4>
                      <span className="text-sm text-muted-foreground font-body">{formatCurrency(spent)} / {formatCurrency(goal.amount)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${progress}%`}}
                      ></div>
                    </div>
                     <p className={`text-xs mt-1 font-body ${progress > 100 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {progress.toFixed(0)}% of budget used. 
                        {progress > 100 && ` Overspent by ${formatCurrency(spent - goal.amount)}`}
                        {progress <= 100 && ` ${formatCurrency(goal.amount - spent)} remaining.`}
                      </p>
                  </div>
                )
              })}
            </div>
             ) : (
              <p className="text-muted-foreground font-body">No budget goals set yet. <Link href="/budgets" className="text-primary hover:underline">Set Budgets</Link></p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
