const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const { authenticateJWT, requireActiveUser } = require('../middleware/auth');
const { Payment, Match, Profile } = require('../models');

/**
 * POST /api/payments/create-intent
 * Create Stripe payment intent for unlocking a match
 */
router.post('/create-intent', authenticateJWT, requireActiveUser, [
  body('match_id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { match_id } = req.body;
    const userId = req.user.user_id;

    // Find the match
    const match = await Match.findOne({
      where: {
        match_id,
        viewer_user_id: userId
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if already unlocked
    if (match.is_unlocked) {
      return res.status(400).json({ error: 'Match already unlocked' });
    }

    // Get unlock price from env (in cents)
    const amountCents = parseInt(process.env.UNLOCK_PRICE) || 100; // Default $1.00
    const currency = process.env.UNLOCK_CURRENCY || 'usd';

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata: {
        user_id: userId,
        match_id,
        product: 'profile_unlock'
      },
      description: 'Unlock profile contact',
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Create payment record
    const payment = await Payment.create({
      user_id: userId,
      match_id,
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: amountCents,
      currency,
      status: 'pending',
      description: 'Unlock profile contact',
      metadata: {
        match_id,
        product: 'profile_unlock'
      }
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_id: payment.payment_id,
      amount: amountCents,
      currency
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

/**
 * POST /api/payments/webhook
 * Stripe webhook handler
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;

    case 'charge.refunded':
      await handleRefund(event.data.object);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent) {
  try {
    // Find payment record
    const payment = await Payment.findByStripeIntentId(paymentIntent.id);

    if (!payment) {
      console.error('Payment record not found for intent:', paymentIntent.id);
      return;
    }

    // Update payment status
    await payment.markSucceeded(
      paymentIntent.charges.data[0]?.id,
      paymentIntent.charges.data[0]?.receipt_url
    );

    // Update payment method details
    const paymentMethod = paymentIntent.payment_method;
    if (paymentMethod && typeof paymentMethod === 'object') {
      payment.payment_method = paymentMethod.type;
      if (paymentMethod.card) {
        payment.last_4_digits = paymentMethod.card.last4;
        payment.card_brand = paymentMethod.card.brand;
      }
      await payment.save();
    }

    // Unlock the match
    const match = await Match.findByPk(payment.match_id);
    if (match) {
      await match.unlock(payment.payment_id);

      // Increment unlock count for matched user's profile
      const matchedProfile = await Profile.findOne({
        where: { user_id: match.matched_user_id }
      });
      if (matchedProfile) {
        await matchedProfile.increment('total_unlocks_received');
      }
    }

    console.log('Payment succeeded:', payment.payment_id);
  } catch (error) {
    console.error('Handle payment success error:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
  try {
    const payment = await Payment.findByStripeIntentId(paymentIntent.id);

    if (!payment) {
      console.error('Payment record not found for intent:', paymentIntent.id);
      return;
    }

    const errorCode = paymentIntent.last_payment_error?.code || 'unknown';
    const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

    await payment.markFailed(errorCode, errorMessage);

    console.log('Payment failed:', payment.payment_id, errorCode);
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

/**
 * Handle refund
 */
async function handleRefund(charge) {
  try {
    const payment = await Payment.findOne({
      where: { stripe_charge_id: charge.id }
    });

    if (!payment) {
      console.error('Payment record not found for charge:', charge.id);
      return;
    }

    const refundAmount = charge.amount_refunded;
    const reason = charge.refunds?.data[0]?.reason || 'requested_by_customer';

    await payment.markRefunded(refundAmount, reason);

    // Lock the match again if it was unlocked
    if (payment.match_id) {
      const match = await Match.findByPk(payment.match_id);
      if (match) {
        match.is_unlocked = false;
        match.chat_enabled = false;
        match.status = 'shown';
        await match.save();
      }
    }

    console.log('Refund processed:', payment.payment_id);
  } catch (error) {
    console.error('Handle refund error:', error);
  }
}

/**
 * GET /api/payments/history
 * Get user's payment history
 */
router.get('/history', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 50;

    const payments = await Payment.getUserPaymentHistory(userId, limit);

    res.json({
      payments: payments.map(p => ({
        payment_id: p.payment_id,
        amount_cents: p.amount_cents,
        currency: p.currency,
        status: p.status,
        description: p.description,
        payment_method: p.payment_method,
        last_4_digits: p.last_4_digits,
        card_brand: p.card_brand,
        initiated_at: p.initiated_at,
        completed_at: p.completed_at,
        receipt_url: p.receipt_url
      }))
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

/**
 * GET /api/payments/:paymentId
 * Get specific payment details
 */
router.get('/:paymentId', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.user_id;

    const payment = await Payment.findOne({
      where: {
        payment_id: paymentId,
        user_id: userId
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to get payment' });
  }
});

/**
 * GET /api/payments/stats
 * Get payment statistics
 */
router.get('/stats', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const totalPaid = await Payment.sum('amount_cents', {
      where: {
        user_id: userId,
        status: 'succeeded'
      }
    });

    const successfulPayments = await Payment.getSuccessfulPaymentsCount(userId);

    res.json({
      total_paid_cents: totalPaid || 0,
      total_paid_dollars: (totalPaid || 0) / 100,
      successful_payments: successfulPayments
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Failed to get payment statistics' });
  }
});

module.exports = router;
