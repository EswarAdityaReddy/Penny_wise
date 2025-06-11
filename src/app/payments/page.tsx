import StripeCheckoutForm from '@/components/payments/StripeCheckoutForm';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function PaymentsPage() {
  return (
    <div className="container mx-auto py-8 px-2 sm:px-6">
      <Card className="max-w-xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Make a Payment</CardTitle>
          <CardDescription className="font-body text-center">
            Enter your payment details below to complete your transaction.
            Ensure Stripe API keys are correctly set in your <code>.env</code> file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StripeCheckoutForm />
        </CardContent>
      </Card>
      <div className="mt-6 text-center text-xs text-muted-foreground font-body">
        <p>This is a test payment form. Do not use real card details unless your Stripe account is in test mode.</p>
        <p>Ensure <code>STRIPE_SECRET_KEY</code> and <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> are set.</p>
      </div>
    </div>
  );
}
