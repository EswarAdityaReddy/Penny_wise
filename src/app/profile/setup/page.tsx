
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

// Firestore imports - will be needed for more extensive profile data
// import { doc, setDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase/config';

export default function ProfileSetupPage() {
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin'); 
    }
    if (user && user.displayName) {
        setDisplayName(user.displayName);
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to set up a profile.', variant: 'destructive' });
      return;
    }
    if (!displayName.trim()) {
      toast({ title: 'Validation Error', description: 'Display name cannot be empty.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      
      // Future step: Save additional profile details to Firestore
      // e.g., await setDoc(doc(db, 'userProfiles', user.uid), { displayName: displayName.trim(), createdAt: new Date(), ...otherDetails });
      
      toast({ title: 'Profile Updated!', description: 'Your display name has been set.' });
      router.push('/dashboard'); 
    } catch (error: any) {
      console.error("Profile setup error:", error);
      toast({ title: 'Profile Setup Failed', description: error.message || 'Could not update profile.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Complete Your Profile</CardTitle>
          <CardDescription className="font-body text-center">
            Help us personalize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your Name or Nickname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full font-body" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save and Continue
            </Button>
          </form>
        </CardContent>
         <CardFooter className="flex-col items-center space-y-2">
            <Button variant="link" size="sm" onClick={() => router.push('/dashboard')} className="font-body text-sm" disabled={isLoading}>
                Skip for now & go to Dashboard
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
