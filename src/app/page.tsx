
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to the sign-in page on launch
    router.replace('/signin');
  }, [router]);

  // Show a loading screen while the initial redirection to /signin is happening
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 font-body text-lg text-foreground">Loading PennyWise...</p>
    </div>
  );
}
