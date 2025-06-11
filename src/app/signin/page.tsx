
// src/app/signin/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

// Simple SVG for Google G icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);


export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { toast } = useToast();

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!recaptchaVerifierRef.current && recaptchaContainerRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          toast({ title: 'reCAPTCHA Expired', description: 'Please try sending OTP again.', variant: 'destructive' });
        }
      });
    }
    // Cleanup reCAPTCHA on unmount
    return () => {
        recaptchaVerifierRef.current?.clear();
    };
  }, [auth, toast]);


  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Signed In!', description: 'Welcome back! Redirecting to dashboard...' });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with email.');
      toast({ title: 'Sign In Failed', description: err.message || 'Check your credentials and try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    setIsLoading(true);
    if (!recaptchaVerifierRef.current) {
      setError("reCAPTCHA verifier not initialized.");
      toast({ title: 'OTP Error', description: 'reCAPTCHA not ready. Please refresh.', variant: 'destructive'});
      setIsLoading(false);
      return;
    }
    try {
      const formattedPhoneNumber = `+${phoneNumber.replace(/\D/g, '')}`; // Ensure E.164 format, e.g., +11234567890
      const confirmation = await signInWithPhoneNumber(auth, formattedPhoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
      toast({ title: 'OTP Sent!', description: `An OTP has been sent to ${formattedPhoneNumber}.` });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
      toast({ title: 'OTP Send Failed', description: err.message || 'Please check the phone number and try again.', variant: 'destructive' });
      recaptchaVerifierRef.current.render().then(widgetId => {
        // @ts-ignore
        if (window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
           window.grecaptcha.reset(widgetId);
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setIsLoading(true);
    if (!confirmationResult) {
      setError('No OTP confirmation context found.');
      toast({ title: 'OTP Error', description: 'Verification context missing. Try sending OTP again.', variant: 'destructive'});
      setIsLoading(false);
      return;
    }
    try {
      await confirmationResult.confirm(otp);
      toast({ title: 'Signed In!', description: 'Successfully signed in with phone number! Redirecting...' });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP.');
      toast({ title: 'OTP Verification Failed', description: err.message || 'Invalid OTP or an error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: 'Signed In!', description: 'Successfully signed in with Google! Redirecting...' });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      toast({ title: 'Google Sign In Failed', description: err.message || 'Could not sign in with Google. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading || (!authLoading && user)) {
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
          <CardTitle className="font-headline text-2xl text-center">Sign In</CardTitle>
          <CardDescription className="font-body text-center">
            Welcome back to PennyWise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || isOtpSent}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || isOtpSent}
              />
            </div>
            <Button type="submit" className="w-full font-body" disabled={isLoading || isOtpSent}>
              {isLoading && !isOtpSent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In with Email
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-body">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full font-body" onClick={handleGoogleSignIn} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Sign In with Google
          </Button>
          
          <div className="space-y-4">
            {!isOtpSent ? (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (e.g., +11234567890)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button onClick={handleSendOtp} className="w-full font-body mt-2" disabled={isLoading || !phoneNumber}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send OTP
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  disabled={isLoading}
                />
                <Button onClick={handleVerifyOtp} className="w-full font-body mt-2" disabled={isLoading || !otp || otp.length < 6}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify OTP & Sign In
                </Button>
                 <Button variant="link" size="sm" onClick={() => { setIsOtpSent(false); setOtp(''); setConfirmationResult(null); setError(null); }} className="font-body text-sm" disabled={isLoading}>
                    Use a different phone number?
                </Button>
              </div>
            )}
             {error && <p className="text-sm text-destructive font-body">{error}</p>}
          </div>
          <div ref={recaptchaContainerRef}></div> {/* Invisible reCAPTCHA container */}
        </CardContent>
        <CardFooter className="flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground font-body">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
