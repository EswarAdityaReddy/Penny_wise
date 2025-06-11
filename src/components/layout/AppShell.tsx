
// src/components/layout/AppShell.tsx
"use client";

import type { ReactNode } from 'react';
import React from 'react'; // Ensured React is imported
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayoutDashboard, ListPlus, Tags, Target, CreditCard, Moon, Sun, LogIn, UserPlus, LogOut, Loader2 } from 'lucide-react'; // Added LogOut
import { useAuthContext } from '@/contexts/AuthContext'; // Import useAuthContext

const ThemeToggle = () => {
  const [currentTheme, setCurrentTheme] = React.useState('light');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setCurrentTheme(isDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      setCurrentTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      setCurrentTheme('dark');
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {currentTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
};

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ListPlus },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/budgets', label: 'Budgets', icon: Target },
  { href: '/payments', label: 'Payments', icon: CreditCard },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, signOut, loading: authLoading } = useAuthContext(); // Use the actual auth context

  // Determine if the current page is an auth page to hide sidebar/header if needed
  // or to simplify the shell. For now, we'll keep the shell consistent.
  const isAuthPage = pathname === '/signin' || pathname === '/signup';

  // If on an auth page and user is not loaded yet, or if user is loaded and present,
  // we might want to show a simplified layout or redirect.
  // For now, these pages handle their own redirection logic.

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <ScrollArea className="flex-grow">
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                      tooltip={{ children: item.label, className: "font-body" }}
                      className="font-body"
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </ScrollArea>
        <SidebarFooter className="border-t border-sidebar-border p-2 space-y-2">
           {authLoading ? (
             <div className="flex justify-center items-center h-10">
                <Loader2 className="h-5 w-5 animate-spin" />
             </div>
           ) : !user ? (
              <>
                <Link href="/signin">
                  <Button variant="outline" className="w-full justify-start font-body">
                    <LogIn className="mr-2 h-4 w-4" /> Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" className="w-full justify-start font-body">
                     <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <Button variant="outline" onClick={signOut} className="w-full justify-start font-body">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                 {user.email && <span className="text-xs truncate ml-auto pl-1 text-muted-foreground">{user.email}</span>}
              </Button>
            )}
          <div className="flex justify-start items-center">
             <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {/* Header is only shown if not on an auth page, or if a user is loaded (they'd be redirected) */}
        {!isAuthPage && (
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-2 sm:px-6 sm:static sm:h-auto sm:border-0 sm:bg-transparent py-4">
            <SidebarTrigger className="sm:hidden" />
            <h1 className="font-headline text-xl font-semibold capitalize">
              {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </h1>
          </header>
        )}
        <main className={`flex-1 ${!isAuthPage ? 'p-2 sm:px-6 sm:py-0' : ''} space-y-4`}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
