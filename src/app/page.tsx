
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // User is logged in
        // Check if user needs to go to profile setup (e.g., displayName is missing)
        // More robust checks can be added here if you store more profile details in Firestore
        const metadata = user.metadata;
        if (user.displayName || (metadata && metadata.creationTime !== metadata.lastSignInTime && user.displayName) ) { 
          router.replace('/dashboard');
        } else {
          // New user or profile not fully set up (e.g. Google sign in without display name yet)
          router.replace('/profile/setup');
        }
      } else {
        // User is not logged in, redirect to sign-in
        router.replace('/signin');
      }
    }
  }, [user, authLoading, router]);

  // Show a loading screen while auth state is being determined or redirection is happening
  if (authLoading || (!authLoading && !user) || (!authLoading && user)) { // Simplified condition to always show loader until redirect happens
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 font-body text-lg text-foreground">Loading PennyWise...</p>
      </div>
    );
  }
  
  // Fallback, though useEffect should handle redirection.
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <p className="text-foreground">Preparing your PennyWise experience...</p>
    </div>
  );
}

