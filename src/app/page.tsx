
'use client';

// This page should ideally not be reached if the redirect in next.config.js works.
// It serves as a fallback or if Next.js requires a root page component.
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 font-body text-lg text-foreground">Loading PennyWise...</p>
    </div>
  );
}
