'use client';
import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import type { StripeCardElementOptions, StripeElementsOptions } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createPaymentIntentAction } from '@/lib/actions/stripeActions';
import { Loader2 } from 'lucide-react';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error("Stripe publishable key is not set. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env file.");
}

// Initialize Stripe.js with the publishable key
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const StripeCheckoutFormComponent: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [amount, setAmount] = useState(1000); // Example amount in cents ($10.00)
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    // Create PaymentIntent when amount changes or component mounts
    if (amount > 0 && stripePublishableKey) { // Ensure key is present before calling
      setIsProcessing(true); // Indicate loading of payment intent
      setPaymentError(null);
      createPaymentIntentAction({ amount: amount, currency: 'usd' })
        .then(data => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else if (data.error) {
            setPaymentError(data.error);
            toast({ title: 'Payment Setup Error', description: data.error, variant: 'destructive' });
          }
        })
        .catch(err => {
          setPaymentError('Failed to initialize payment method.');
          toast({ title: 'Payment Setup Error', description: 'Could not connect to Stripe to create payment intent.', variant: 'destructive' });
        })
        .finally(() => {
          setIsProcessing(false); // Done loading payment intent
        });
    }
  }, [amount, toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) {
      setPaymentError('Stripe is not ready or payment cannot be processed. Please wait or refresh.');
      toast({ title: 'Stripe Error', description: 'Stripe.js has not loaded or client secret is missing.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError('Card details element not found. Please refresh.');
      toast({ title: 'Stripe Error', description: 'Card details component not found.', variant: 'destructive' });
      setIsProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        // billing_details: { name: 'Jenny Rosen' }, // Optional: Collect billing details
      },
    });

    if (stripeError) {
      setPaymentError(stripeError.message || 'An unexpected payment error occurred.');
      toast({ title: 'Payment Failed', description: stripeError.message || 'An unexpected error occurred during payment.', variant: 'destructive' });
    } else if (paymentIntent?.status === 'succeeded') {
      toast({ title: 'Payment Successful!', description: `Your payment of $${(amount / 100).toFixed(2)} was successful.` });
      // Here you might want to redirect the user, update your database, etc.
      // For now, we'll just show a success message.
      // You might also want to fetch a new clientSecret for subsequent payments if the form remains.
       createPaymentIntentAction({ amount: amount, currency: 'usd' })
         .then(data => data.clientSecret && setClientSecret(data.clientSecret));

    } else {
      setPaymentError('Payment was not successful. Status: ' + paymentIntent?.status);
      toast({ title: 'Payment Incomplete', description: `Payment status: ${paymentIntent?.status}. Please try again or contact support.`, variant: 'default' });
    }
    setIsProcessing(false);
  };

  const cardElementOptions: StripeCardElementOptions = {
    style: {
      base: {
        color: 'hsl(var(--foreground))', // Use CSS variable for text color
        fontFamily: 'PT Sans, sans-serif', // Match body font
        fontSize: '16px',
        '::placeholder': {
          color: 'hsl(var(--muted-foreground))',
        },
        iconColor: 'hsl(var(--primary))',
      },
      invalid: {
        color: 'hsl(var(--destructive))',
        iconColor: 'hsl(var(--destructive))',
      },
    },
    // Hides the postal code field (optional, depending on your needs/Stripe settings)
    // hidePostalCode: true, 
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="amount" className="font-body">Amount (USD)</Label>
        <Input
          id="amount"
          type="number"
          value={(amount / 100).toFixed(2)}
          onChange={(e) => {
            const newAmount = Math.round(parseFloat(e.target.value) * 100);
            if (!isNaN(newAmount) && newAmount >= 50) { // Stripe min often 50 cents
                 setAmount(newAmount);
            } else if (e.target.value === "") {
                 setAmount(0); // Allow clearing input
            }
          }}
          min="0.50" 
          step="0.01"
          className="font-body"
          disabled={isProcessing && !clientSecret} // Disable if PI is loading initially
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="card-element" className="font-body">Card Details</Label>
        <div className="p-3 border border-input rounded-md bg-transparent focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <CardElement id="card-element" options={cardElementOptions} />
        </div>
      </div>
      {paymentError && <p className="text-sm text-destructive font-body">{paymentError}</p>}
      <Button 
        type="submit" 
        disabled={!stripe || !elements || isProcessing || !clientSecret || !!paymentError || amount < 50} 
        className="w-full font-body"
      >
        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Pay ${(amount / 100).toFixed(2)}
      </Button>
    </form>
  );
};

const StripeCheckoutFormWrapper: React.FC = () => {
  if (!stripePromise) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 border border-destructive rounded-md bg-destructive/10 text-destructive font-body">
          Stripe is not configured. Please ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set in your environment variables.
      </div>
    );
  }

  const options: StripeElementsOptions = {
    // clientSecret will be set later via PaymentIntent
    // appearance: { theme: 'stripe' }, // or 'night', 'flat', or custom
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeCheckoutFormComponent />
    </Elements>
  );
}
export default StripeCheckoutFormWrapper;
