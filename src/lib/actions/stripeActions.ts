'use server';

import Stripe from 'stripe';
import { z } from 'zod';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20', // Use a recent API version
  typescript: true,
});

const CreatePaymentIntentInputSchema = z.object({
  amount: z.number().positive('Amount must be a positive number.'),
  currency: z.string().default('usd'),
  // You can add more fields here like customer ID, metadata, etc.
});
export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentInputSchema>;

export async function createPaymentIntentAction(input: CreatePaymentIntentInput): Promise<{ clientSecret: string | null; error?: string }> {
  try {
    const validatedInput = CreatePaymentIntentInputSchema.parse(input);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: validatedInput.amount, // Amount in cents
      currency: validatedInput.currency,
      automatic_payment_methods: { enabled: true },
      // You can add a customer ID here if you manage customers in Stripe
      // customer: 'cus_xxxxxxxxxxxxxx', 
      // Add metadata if needed
      // metadata: { order_id: 'your_order_id' },
    });
    return { clientSecret: paymentIntent.client_secret };
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    if (error instanceof z.ZodError) {
      return { clientSecret: null, error: `Invalid input: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { clientSecret: null, error: error.message || 'Failed to create payment intent.' };
  }
}
