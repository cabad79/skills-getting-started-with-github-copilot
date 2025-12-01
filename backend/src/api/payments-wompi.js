const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateJWT, requireActiveUser } = require('../middleware/auth');
const { Payment, Match, Profile } = require('../models');
const wompiService = require('../services/wompiService');

/**
 * GET /api/payments/wompi/config
 * Get Wompi public configuration
 */
router.get('/wompi/config', (req, res) => {
  res.json({
    public_key: process.env.WOMPI_PUBLIC_KEY,
    currency: process.env.WOMPI_CURRENCY || 'COP',
    environment: process.env.WOMPI_ENVIRONMENT || 'sandbox',
    unlock_price_usd: parseFloat(process.env.UNLOCK_PRICE_USD) || 1.00,
    exchange_rate: parseInt(process.env.USD_TO_COP_RATE) || 4000
  });
});

/**
 * GET /api/payments/wompi/acceptance-token
 * Get Wompi acceptance token (required for payments)
 */
router.get('/wompi/acceptance-token', async (req, res) => {
  try {
    const acceptanceData = await wompiService.createAcceptanceToken();

    res.json({
      acceptance_token: acceptanceData.acceptance_token,
      permalink: acceptanceData.permalink,
      message: 'User must accept terms before payment'
    });
  } catch (error) {
    console.error('Get acceptance token error:', error);
    res.status(500).json({ error: 'Failed to get acceptance token' });
  }
});

/**
 * POST /api/payments/wompi/create-transaction
 * Create Wompi transaction for unlocking a match
 */
router.post('/wompi/create-transaction', authenticateJWT, requireActiveUser, [
  body('match_id').isUUID(),
  body('payment_method').isObject(),
  body('acceptance_token').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      match_id,
      payment_method,
      acceptance_token,
      payment_source_id
    } = req.body;

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

    // Get unlock price and convert to COP
    const unlockPriceUSD = parseFloat(process.env.UNLOCK_PRICE_USD) || 1.00;
    const amountInCentsCOP = await wompiService.convertUSDtoCOP(unlockPriceUSD);

    // Generate unique reference
    const reference = `PM-${userId.substring(0, 8)}-${match_id.substring(0, 8)}-${Date.now()}`;

    // Create Wompi transaction
    const transaction = await wompiService.createTransaction({
      amount_in_cents: amountInCentsCOP,
      currency: process.env.WOMPI_CURRENCY || 'COP',
      customer_email: req.user.email,
      payment_method,
      payment_source_id,
      reference,
      user_id: userId,
      match_id,
      full_name: `User ${userId.substring(0, 8)}`,
      phone_number: req.body.phone_number || ''
    });

    // Create payment record
    const payment = await Payment.create({
      user_id: userId,
      match_id,
      stripe_payment_intent_id: transaction.transaction_id, // Reuse field for Wompi ID
      amount_cents: amountInCentsCOP,
      currency: transaction.currency,
      status: 'pending',
      description: 'Unlock profile contact',
      metadata: {
        wompi_transaction_id: transaction.transaction_id,
        wompi_reference: transaction.reference,
        payment_method_type: transaction.payment_method_type,
        match_id,
        product: 'profile_unlock'
      }
    });

    res.json({
      transaction_id: transaction.transaction_id,
      payment_id: payment.payment_id,
      status: transaction.status,
      amount_in_cents: transaction.amount_in_cents,
      currency: transaction.currency,
      payment_link: transaction.payment_link,
      reference: transaction.reference
    });
  } catch (error) {
    console.error('Create Wompi transaction error:', error);
    res.status(500).json({
      error: 'Failed to create transaction',
      message: error.message
    });
  }
});

/**
 * POST /api/payments/wompi/create-link
 * Create Wompi payment link (hosted checkout)
 */
router.post('/wompi/create-link', authenticateJWT, requireActiveUser, [
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

    if (match.is_unlocked) {
      return res.status(400).json({ error: 'Match already unlocked' });
    }

    // Get unlock price
    const unlockPriceUSD = parseFloat(process.env.UNLOCK_PRICE_USD) || 1.00;
    const amountInCentsCOP = await wompiService.convertUSDtoCOP(unlockPriceUSD);

    // Generate reference
    const reference = `PM-${userId.substring(0, 8)}-${match_id.substring(0, 8)}-${Date.now()}`;

    // Create payment link
    const paymentLink = await wompiService.createPaymentLink({
      name: 'Unlock Profile',
      description: 'Unlock match contact information on PersonalityMatch',
      amount_in_cents: amountInCentsCOP,
      currency: process.env.WOMPI_CURRENCY || 'COP',
      reference,
      redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
      metadata: {
        user_id: userId,
        match_id,
        product: 'profile_unlock'
      }
    });

    // Create payment record
    const payment = await Payment.create({
      user_id: userId,
      match_id,
      stripe_payment_intent_id: reference, // Store reference
      amount_cents: amountInCentsCOP,
      currency: 'COP',
      status: 'pending',
      description: 'Unlock profile contact',
      metadata: {
        wompi_reference: reference,
        payment_link: paymentLink,
        match_id,
        product: 'profile_unlock'
      }
    });

    res.json({
      payment_id: payment.payment_id,
      payment_link: paymentLink,
      reference,
      amount_in_cents: amountInCentsCOP,
      currency: 'COP'
    });
  } catch (error) {
    console.error('Create payment link error:', error);
    res.status(500).json({
      error: 'Failed to create payment link',
      message: error.message
    });
  }
});

/**
 * GET /api/payments/wompi/transaction/:id
 * Get transaction status
 */
router.get('/wompi/transaction/:transactionId', authenticateJWT, requireActiveUser, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.user_id;

    // Find payment record
    const payment = await Payment.findOne({
      where: {
        user_id: userId,
        stripe_payment_intent_id: transactionId
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Get transaction from Wompi
    const transaction = await wompiService.getTransaction(transactionId);

    // Update payment status if changed
    if (transaction.status === 'APPROVED' && payment.status !== 'succeeded') {
      await handlePaymentSuccess(payment, transaction);
    } else if (transaction.status === 'DECLINED' && payment.status !== 'failed') {
      await payment.markFailed('DECLINED', 'Transaction declined');
    }

    res.json({
      transaction_id: transaction.id,
      status: transaction.status,
      amount_in_cents: transaction.amount_in_cents,
      currency: transaction.currency,
      payment_method_type: transaction.payment_method_type,
      finalized_at: transaction.finalized_at
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
});

/**
 * POST /api/payments/wompi/webhook
 * Wompi webhook handler
 */
router.post('/wompi/webhook', express.json(), async (req, res) => {
  try {
    const event = req.body;
    const signature = req.headers['x-wompi-signature'];

    // Verify signature
    if (!wompiService.verifyWebhookSignature(event, signature)) {
      console.error('Invalid Wompi webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const eventType = event.event;
    const transaction = event.data.transaction;

    console.log(`Wompi webhook received: ${eventType}`, transaction.id);

    switch (eventType) {
      case 'transaction.updated':
        if (transaction.status === 'APPROVED') {
          await handleWebhookPaymentSuccess(transaction);
        } else if (transaction.status === 'DECLINED') {
          await handleWebhookPaymentFailed(transaction);
        }
        break;

      default:
        console.log(`Unhandled Wompi event: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Wompi webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(payment, transaction) {
  try {
    // Update payment status
    payment.status = 'succeeded';
    payment.stripe_charge_id = transaction.id;
    payment.completed_at = new Date(transaction.finalized_at);
    payment.payment_method = transaction.payment_method_type;
    payment.metadata = {
      ...payment.metadata,
      wompi_transaction: transaction
    };
    await payment.save();

    // Unlock the match
    const match = await Match.findByPk(payment.match_id);
    if (match) {
      await match.unlock(payment.payment_id);

      // Increment unlock count
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
 * Handle webhook payment success
 */
async function handleWebhookPaymentSuccess(transaction) {
  try {
    const payment = await Payment.findOne({
      where: {
        stripe_payment_intent_id: transaction.id
      }
    });

    if (!payment) {
      console.error('Payment not found for transaction:', transaction.id);
      return;
    }

    await handlePaymentSuccess(payment, transaction);
  } catch (error) {
    console.error('Handle webhook payment success error:', error);
  }
}

/**
 * Handle webhook payment failed
 */
async function handleWebhookPaymentFailed(transaction) {
  try {
    const payment = await Payment.findOne({
      where: {
        stripe_payment_intent_id: transaction.id
      }
    });

    if (!payment) {
      console.error('Payment not found for transaction:', transaction.id);
      return;
    }

    await payment.markFailed('DECLINED', transaction.status_message || 'Transaction declined');

    console.log('Payment failed:', payment.payment_id);
  } catch (error) {
    console.error('Handle webhook payment failed error:', error);
  }
}

/**
 * GET /api/payments/wompi/methods
 * Get available payment methods
 */
router.get('/wompi/methods', async (req, res) => {
  try {
    const methods = await wompiService.getPaymentMethods();

    res.json({
      payment_methods: methods,
      available_methods: ['CARD', 'NEQUI', 'PSE', 'BANCOLOMBIA_TRANSFER']
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

module.exports = router;
