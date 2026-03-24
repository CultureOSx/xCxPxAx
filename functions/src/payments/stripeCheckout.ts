import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2026-02-25.clover',
});

const db = admin.firestore();

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  // 1. Verify Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to purchase perks.');
  }
  const uid = context.auth.uid;

  // 2. Validate Request
  const { perkId } = data;
  if (!perkId) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a perkId.');
  }

  // 3. Fetch Perk Data
  const perkDoc = await db.collection('perks').doc(perkId).get();
  if (!perkDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Perk not found.');
  }

  const perk = perkDoc.data();
  if (!perk || perk.priceTier === 'free') {
    throw new functions.https.HttpsError('failed-precondition', 'This perk is free and does not require checkout.');
  }

  const priceCents = perk.discountedPriceCents || perk.originalPriceCents || 500; // fallback to $5.00
  
  // 4. Create Stripe Checkout Session
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      mode: 'payment',
      success_url: `https://culturepass.app/perks/${perkId}?success=true`,
      cancel_url: `https://culturepass.app/perks/${perkId}?canceled=true`,
      customer_email: context.auth.token.email,
      client_reference_id: uid, // Track which user is purchasing
      metadata: {
        perkId: perkId,
      },
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: perk.title || 'Premium Cultural Perk',
              description: perk.description || 'Exclusive access via CulturePass.',
              images: perk.coverUrl ? [perk.coverUrl] : [],
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating Stripe Checkout session:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create checkout session.');
  }
});
