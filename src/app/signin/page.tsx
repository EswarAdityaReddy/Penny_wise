
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
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

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
      // Reset reCAPTCHA if necessary, Firebase handles some of this.
      recaptchaVerifierRef.current.render().then(widgetId => {
        // @ts-ignore
        window.grecaptcha.reset(widgetId);
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
                Or sign in with OTP
              </span>
            </div>
          </div>
          
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
