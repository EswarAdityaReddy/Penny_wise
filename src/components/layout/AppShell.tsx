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
import { LayoutDashboard, ListPlus, Tags, Target, Settings, LogOut, Moon, Sun } from 'lucide-react';
// import { useTheme } from 'next-themes'; // Assuming next-themes is or will be installed for theme toggling

// For now, next-themes is not part of the scaffolding. Let's make a simple toggle.
// A more robust solution would be to integrate next-themes.
const ThemeToggle = () => {
  const [currentTheme, setCurrentTheme] = React.useState('light');

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setCurrentTheme(isDark ? 'dark' : 'light');
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
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

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
        <SidebarFooter className="border-t border-sidebar-border">
           {/* <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/settings">
                <SidebarMenuButton tooltip={{ children: "Settings", className:"font-body"}} className="font-body">
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu> */}
          <div className="p-2 flex justify-between items-center">
             <ThemeToggle />
            {/* User avatar/logout can be added here */}
            {/* <Button variant="ghost" size="icon" aria-label="Log out">
              <LogOut className="h-5 w-5" />
            </Button> */}
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <SidebarTrigger className="sm:hidden" />
          <h1 className="font-headline text-xl font-semibold capitalize">
            {pathname.split('/').pop() || 'Dashboard'}
          </h1>
        </header>
        <main className="flex-1 p-2 sm:px-6 sm:py-0 space-y-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
