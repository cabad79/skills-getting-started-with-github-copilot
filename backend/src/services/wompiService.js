const axios = require('axios');
const crypto = require('crypto');

/**
 * Wompi Payment Gateway Integration
 * Colombian payment processor with lower fees than Stripe
 *
 * Fees: 2.49% + COP 600 (~$0.15 USD)
 * vs Stripe: 2.9% + $0.30 USD
 *
 * Documentation: https://docs.wompi.co/en/docs/colombia/referencia/
 */

class WompiService {
  constructor() {
    this.publicKey = process.env.WOMPI_PUBLIC_KEY;
    this.privateKey = process.env.WOMPI_PRIVATE_KEY;
    this.integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    this.baseURL = process.env.WOMPI_ENVIRONMENT === 'production'
      ? 'https://production.wompi.co/v1'
      : 'https://sandbox.wompi.co/v1';

    this.currency = process.env.WOMPI_CURRENCY || 'COP'; // Colombian Peso
    this.redirectURL = process.env.WOMPI_REDIRECT_URL || process.env.FRONTEND_URL;
  }

  /**
   * Create acceptance token (required first step)
   * User must accept Wompi terms and conditions
   */
  async createAcceptanceToken() {
    try {
      const response = await axios.get(
        `${this.baseURL}/merchants/${this.publicKey}`
      );

      return {
        acceptance_token: response.data.data.presigned_acceptance.acceptance_token,
        permalink: response.data.data.presigned_acceptance.permalink
      };
    } catch (error) {
      console.error('Wompi acceptance token error:', error.response?.data || error.message);
      throw new Error('Failed to create acceptance token');
    }
  }

  /**
   * Create payment source (tokenize card)
   * @param {object} cardData - Card information
   * @returns {string} Payment source ID
   */
  async createPaymentSource(cardData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payment_sources`,
        {
          type: 'CARD',
          token: cardData.token, // Card token from Wompi.js
          customer_email: cardData.email,
          acceptance_token: cardData.acceptance_token
        },
        {
          headers: {
            'Authorization': `Bearer ${this.publicKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data.id;
    } catch (error) {
      console.error('Wompi payment source error:', error.response?.data || error.message);
      throw new Error('Failed to create payment source');
    }
  }

  /**
   * Create transaction (charge)
   * @param {object} transactionData - Transaction details
   * @returns {object} Transaction details
   */
  async createTransaction(transactionData) {
    const {
      amount_in_cents, // Amount in cents (e.g., 100 = $1 USD = ~4000 COP)
      currency = this.currency,
      customer_email,
      payment_method,
      payment_source_id,
      reference,
      user_id,
      match_id
    } = transactionData;

    try {
      // Generate signature for integrity
      const signature = this.generateSignature(reference, amount_in_cents, currency);

      const requestBody = {
        amount_in_cents,
        currency,
        customer_email,
        payment_method: {
          type: payment_method.type, // 'CARD', 'NEQUI', 'PSE', 'BANCOLOMBIA_TRANSFER'
          ...payment_method.data
        },
        reference, // Unique transaction reference
        customer_data: {
          phone_number: transactionData.phone_number || '',
          full_name: transactionData.full_name || 'PersonalityMatch User'
        },
        redirect_url: `${this.redirectURL}/payment/callback`,
        metadata: {
          user_id,
          match_id,
          product: 'profile_unlock'
        }
      };

      // Add payment source if using saved card
      if (payment_source_id) {
        requestBody.payment_method.installments = 1;
        requestBody.payment_source_id = payment_source_id;
      }

      const response = await axios.post(
        `${this.baseURL}/transactions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.privateKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        transaction_id: response.data.data.id,
        status: response.data.data.status,
        reference: response.data.data.reference,
        amount_in_cents: response.data.data.amount_in_cents,
        currency: response.data.data.currency,
        payment_method_type: response.data.data.payment_method_type,
        payment_link: response.data.data.payment_link_url,
        created_at: response.data.data.created_at
      };
    } catch (error) {
      console.error('Wompi transaction error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.reason || 'Failed to create transaction');
    }
  }

  /**
   * Get transaction status
   * @param {string} transactionId - Wompi transaction ID
   * @returns {object} Transaction details
   */
  async getTransaction(transactionId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transactions/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.publicKey}`
          }
        }
      );

      return {
        id: response.data.data.id,
        status: response.data.data.status, // APPROVED, DECLINED, PENDING, VOIDED, ERROR
        reference: response.data.data.reference,
        amount_in_cents: response.data.data.amount_in_cents,
        currency: response.data.data.currency,
        payment_method_type: response.data.data.payment_method_type,
        customer_email: response.data.data.customer_email,
        finalized_at: response.data.data.finalized_at,
        metadata: response.data.data.metadata
      };
    } catch (error) {
      console.error('Wompi get transaction error:', error.response?.data || error.message);
      throw new Error('Failed to get transaction');
    }
  }

  /**
   * Verify webhook signature
   * @param {object} event - Webhook event data
   * @param {string} signature - Signature from header
   * @returns {boolean} True if valid
   */
  verifyWebhookSignature(event, signature) {
    const {
      id,
      status,
      amount_in_cents,
      currency,
      reference,
      finalized_at
    } = event.data.transaction;

    // Concatenate values as per Wompi documentation
    const concatenated = `${id}${status}${amount_in_cents}${currency}${reference}${finalized_at}`;

    // Generate checksum
    const checksum = crypto
      .createHash('sha256')
      .update(concatenated + this.integritySecret)
      .digest('hex');

    return checksum === signature;
  }

  /**
   * Generate signature for transaction integrity
   * @param {string} reference - Transaction reference
   * @param {number} amountInCents - Amount in cents
   * @param {string} currency - Currency code
   * @returns {string} Integrity signature
   */
  generateSignature(reference, amountInCents, currency) {
    const concatenated = `${reference}${amountInCents}${currency}`;

    return crypto
      .createHash('sha256')
      .update(concatenated + this.integritySecret)
      .digest('hex');
  }

  /**
   * Convert USD to COP (Colombian Peso)
   * @param {number} amountUSD - Amount in USD
   * @returns {number} Amount in COP cents
   */
  async convertUSDtoCOP(amountUSD) {
    // Get current exchange rate (simplified - in production, use real-time API)
    const exchangeRate = parseInt(process.env.USD_TO_COP_RATE) || 4000;

    // Convert to COP and then to cents
    const amountCOP = amountUSD * exchangeRate;
    const amountCOPCents = Math.round(amountCOP * 100);

    return amountCOPCents;
  }

  /**
   * Create payment link (hosted checkout page)
   * @param {object} linkData - Payment link data
   * @returns {string} Payment link URL
   */
  async createPaymentLink(linkData) {
    const {
      name,
      description,
      amount_in_cents,
      currency = this.currency,
      reference,
      redirect_url
    } = linkData;

    try {
      const response = await axios.post(
        `${this.baseURL}/payment_links`,
        {
          name,
          description,
          amount_in_cents,
          currency,
          single_use: true,
          collect_shipping: false,
          redirect_url: redirect_url || this.redirectURL,
          metadata: linkData.metadata
        },
        {
          headers: {
            'Authorization': `Bearer ${this.privateKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data.permalink;
    } catch (error) {
      console.error('Wompi payment link error:', error.response?.data || error.message);
      throw new Error('Failed to create payment link');
    }
  }

  /**
   * Process refund (void transaction)
   * Note: Wompi only allows voiding within 24 hours
   * @param {string} transactionId - Transaction ID to refund
   * @returns {object} Void result
   */
  async voidTransaction(transactionId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/transactions/${transactionId}/void`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.privateKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        transaction_id: response.data.data.id,
        status: response.data.data.status,
        voided_at: response.data.data.finalized_at
      };
    } catch (error) {
      console.error('Wompi void error:', error.response?.data || error.message);
      throw new Error('Failed to void transaction');
    }
  }

  /**
   * Get supported payment methods
   * @returns {Array} Available payment methods
   */
  async getPaymentMethods() {
    try {
      const response = await axios.get(
        `${this.baseURL}/payment_methods`,
        {
          headers: {
            'Authorization': `Bearer ${this.publicKey}`
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Wompi payment methods error:', error.response?.data || error.message);
      return [];
    }
  }
}

module.exports = new WompiService();
