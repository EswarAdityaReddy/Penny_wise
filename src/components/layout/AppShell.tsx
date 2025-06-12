
// src/components/layout/AppShell.tsx
"use client";

import type { ReactNode } from 'react';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator, // Added SidebarSeparator
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayoutDashboard, ListPlus, Tags, Target, CreditCard, Moon, Sun, LogIn, UserPlus, LogOut, Loader2, UserCircle, PanelLeft } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

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
  const { user, signOut, loading: authLoading } = useAuthContext();

  const isSpecialPage = pathname === '/signin' || pathname === '/signup' || pathname === '/profile/setup' || pathname ==='/';

  return (
    <SidebarProvider defaultOpen>
      {!isSpecialPage && (
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

                <SidebarSeparator className="my-2" />

                {authLoading ? (
                  <SidebarMenuItem>
                    <div className="flex justify-center items-center h-10 px-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </SidebarMenuItem>
                ) : !user ? (
                    <>
                      <SidebarMenuItem>
                        <Link href="/signin">
                           <SidebarMenuButton className="font-body w-full">
                            <LogIn /> Sign In
                           </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href="/signup">
                           <SidebarMenuButton className="font-body w-full">
                             <UserPlus /> Sign Up
                           </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    </>
                  ) : (
                    <>
                    <SidebarMenuItem>
                      <Link href="/profile/setup">
                        <SidebarMenuButton 
                            isActive={pathname === '/profile/setup'} 
                            tooltip={{ children: 'Profile', className: "font-body" }}
                            className="font-body w-full"
                        >
                          <UserCircle /> Profile
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                       <SidebarMenuButton onClick={signOut} className="font-body w-full">
                        <LogOut />
                        <span>Sign Out</span>
                        {user.displayName && <span className="text-xs truncate ml-auto pl-1 text-muted-foreground group-data-[collapsible=icon]:hidden">{user.displayName}</span>}
                        {!user.displayName && user.email && <span className="text-xs truncate ml-auto pl-1 text-muted-foreground group-data-[collapsible=icon]:hidden">{user.email}</span>}
                       </SidebarMenuButton>
                    </SidebarMenuItem>
                    </>
                  )}
                  <SidebarMenuItem>
                    <div className="flex items-center group-data-[collapsible=icon]:justify-center px-2 py-1 w-full">
                       <ThemeToggle />
                       <span className="ml-2 text-sm font-body group-data-[collapsible=icon]:hidden">Toggle Theme</span>
                    </div>
                  </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </ScrollArea>
          {/* SidebarFooter is now empty or can be removed if not needed for other purposes */}
        </Sidebar>
      )}
      <SidebarInset>
        {!isSpecialPage && (
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-2 sm:px-6 sm:static sm:h-auto sm:border-0 sm:bg-transparent py-4">
            <SidebarTrigger className="h-7 w-7" />
            <h1 className="font-headline text-xl font-semibold capitalize">
              {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </h1>
          </header>
        )}
        <main className={`flex-1 ${!isSpecialPage ? 'p-2 sm:px-6 sm:py-0' : ''} ${isSpecialPage ? '' : 'space-y-4'}`}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
