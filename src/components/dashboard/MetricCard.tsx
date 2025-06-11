"use client";

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description?: string;
  className?: string;
}

export function MetricCard({ title, value, icon: Icon, description, className }: MetricCardProps) {
  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-body">{title}</CardTitle>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-headline">{typeof value === 'number' ? formatCurrency(value) : value}</div>
        {description && <p className="text-xs text-muted-foreground pt-1 font-body">{description}</p>}
      </CardContent>
    </Card>
  );
}

// Helper function for currency formatting (can be moved to utils.ts)
export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

// cn utility if not globally available or for component-specific use
// Usually, it's better to import from '@/lib/utils'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
