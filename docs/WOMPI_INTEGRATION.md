# Wompi Payment Gateway Integration Guide

Complete guide for integrating Wompi payment processing into PersonalityMatch.

## 📋 Table of Contents

- [What is Wompi?](#what-is-wompi)
- [Why Wompi?](#why-wompi)
- [Getting Started](#getting-started)
- [Backend Integration](#backend-integration)
- [Frontend Integration](#frontend-integration)
- [Webhook Configuration](#webhook-configuration)
- [Payment Methods](#payment-methods)
- [Testing](#testing)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

---

## What is Wompi?

**Wompi** is a Colombian payment gateway that provides API-first payment processing with lower fees than international alternatives like Stripe.

### Key Features

- ✅ Credit/Debit card processing
- ✅ Colombian payment methods (Nequi, PSE, bank transfers)
- ✅ Lower transaction fees (2.49% vs Stripe's 2.9%)
- ✅ RESTful API
- ✅ Webhook support
- ✅ Hosted checkout pages
- ✅ Recurring payments
- ✅ Multi-currency support

### Official Resources

- **Website**: https://wompi.co/
- **Documentation**: https://docs.wompi.co/en/docs/colombia/referencia/
- **Merchant Portal**: https://comercios.wompi.co/
- **API Reference**: https://docs.wompi.co/en/docs/colombia/api/

---

## Why Wompi?

### Cost Comparison

**Wompi vs Stripe** for 100 transactions @ $1 USD:

| | Wompi | Stripe | Savings |
|---|------:|-------:|--------:|
| **Transaction Fee** | 2.49% + COP 600 | 2.9% + $0.30 | |
| **Per Transaction** | ~$0.27 | ~$0.33 | $0.06 |
| **100 Transactions** | **~$27** | **~$33** | **$6/month** |
| **Annual** | **$324** | **$396** | **$72/year** |

### Benefits for Colombian Market

1. **Local Payment Methods**
   - Nequi (most popular mobile wallet)
   - PSE (bank transfers)
   - Bancolombia transfers
   - Davivienda transfers

2. **Better UX**
   - Familiar interface for Colombian users
   - Local currency (COP)
   - Spanish language support

3. **Compliance**
   - Colombian regulations compliant
   - Local customer support
   - Faster dispute resolution

---

## Getting Started

### 1. Create Wompi Account

1. Visit https://comercios.wompi.co/
2. Click "Registrarse" (Sign Up)
3. Fill in business information
4. Verify email address
5. Complete KYC verification

### 2. Get API Credentials

1. Log in to merchant portal
2. Navigate to **Developers** → **API Keys**
3. Copy your credentials:
   - **Public Key**: `pub_test_xxxxx` (for frontend)
   - **Private Key**: `prv_test_xxxxx` (for backend)
4. Navigate to **Settings** → **Webhooks**
5. Copy your **Integrity Secret**

### 3. Set Up Test Environment

Wompi provides a sandbox environment for testing:

- **Sandbox API**: `https://sandbox.wompi.co/v1`
- **Production API**: `https://production.wompi.co/v1`

Test cards:
- **Visa**: `4242 4242 4242 4242`
- **Mastercard**: `5555 5555 5555 4444`
- **Amex**: `3782 822463 10005`
- **CVV**: Any 3-4 digits
- **Expiry**: Any future date

---

## Backend Integration

### Installation

Already included in cost-optimized version. If setting up separately:

```bash
npm install axios
```

### Configuration

Add to `.env`:

```bash
# Wompi Configuration
WOMPI_PUBLIC_KEY=pub_test_your_key
WOMPI_PRIVATE_KEY=prv_test_your_key
WOMPI_INTEGRITY_SECRET=your_integrity_secret
WOMPI_ENVIRONMENT=sandbox  # or 'production'
WOMPI_CURRENCY=COP

# Pricing
UNLOCK_PRICE_USD=1.00
USD_TO_COP_RATE=4000  # Update periodically
```

### Service Implementation

The `WompiService` class handles all Wompi API interactions:

```javascript
const wompiService = require('../services/wompiService');

// Get acceptance token (required first step)
const acceptance = await wompiService.createAcceptanceToken();

// Create transaction
const transaction = await wompiService.createTransaction({
  amount_in_cents: 400000, // $1 USD = 4000 COP = 400000 cents
  currency: 'COP',
  customer_email: 'user@example.com',
  payment_method: {
    type: 'CARD',
    token: 'tok_xxxxx'
  },
  reference: 'PM-unique-ref-123',
  user_id: 'uuid',
  match_id: 'uuid'
});

// Get transaction status
const status = await wompiService.getTransaction(transaction.transaction_id);

// Create payment link (hosted checkout)
const link = await wompiService.createPaymentLink({
  name: 'Unlock Profile',
  description: 'PersonalityMatch profile unlock',
  amount_in_cents: 400000,
  currency: 'COP',
  reference: 'PM-unique-ref-123',
  metadata: { match_id: 'uuid' }
});
```

### API Routes

#### Get Configuration

```http
GET /api/payments/wompi/config
```

Response:
```json
{
  "public_key": "pub_test_xxxxx",
  "currency": "COP",
  "environment": "sandbox",
  "unlock_price_usd": 1.00,
  "exchange_rate": 4000
}
```

#### Get Acceptance Token

```http
GET /api/payments/wompi/acceptance-token
```

Response:
```json
{
  "acceptance_token": "eyJhbGc...",
  "permalink": "https://wompi.co/aceptacion-...",
  "message": "User must accept terms before payment"
}
```

#### Create Transaction

```http
POST /api/payments/wompi/create-transaction
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "match_id": "uuid",
  "payment_method": {
    "type": "CARD",
    "token": "tok_xxxxx"
  },
  "acceptance_token": "eyJhbGc...",
  "phone_number": "+573001234567"
}
```

Response:
```json
{
  "transaction_id": "1234-567890",
  "payment_id": "uuid",
  "status": "PENDING",
  "amount_in_cents": 400000,
  "currency": "COP",
  "payment_link": "https://checkout.wompi.co/l/xxxxx",
  "reference": "PM-xxxxx-xxxxx-1234567890"
}
```

#### Create Payment Link

```http
POST /api/payments/wompi/create-link
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "match_id": "uuid"
}
```

Response:
```json
{
  "payment_id": "uuid",
  "payment_link": "https://checkout.wompi.co/l/xxxxx",
  "reference": "PM-xxxxx-xxxxx-1234567890",
  "amount_in_cents": 400000,
  "currency": "COP"
}
```

#### Get Transaction Status

```http
GET /api/payments/wompi/transaction/{transaction_id}
Authorization: Bearer {jwt_token}
```

Response:
```json
{
  "transaction_id": "1234-567890",
  "status": "APPROVED",
  "amount_in_cents": 400000,
  "currency": "COP",
  "payment_method_type": "CARD",
  "finalized_at": "2025-12-01T12:00:00Z"
}
```

---

## Frontend Integration

### Option 1: Hosted Checkout (Easiest)

Use Wompi's hosted checkout page:

```javascript
// React component
import { useState } from 'react';

function UnlockButton({ matchId }) {
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);

    try {
      // Create payment link
      const response = await fetch('/api/payments/wompi/create-link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ match_id: matchId })
      });

      const { payment_link } = await response.json();

      // Redirect to Wompi checkout
      window.location.href = payment_link;

    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleUnlock} disabled={loading}>
      {loading ? 'Processing...' : 'Unlock Profile - COP $4,000'}
    </button>
  );
}
```

### Option 2: Embedded Checkout

Use Wompi's JavaScript widget:

```html
<!-- index.html -->
<script src="https://checkout.wompi.co/widget.js"></script>
```

```javascript
// React component
import { useEffect } from 'react';

function WompiCheckout({ config, onSuccess, onError }) {
  useEffect(() => {
    const checkout = new window.WidgetCheckout({
      currency: config.currency,
      amountInCents: config.amount_in_cents,
      reference: config.reference,
      publicKey: config.public_key,
      redirectUrl: `${window.location.origin}/payment/callback`,
      customerData: {
        email: config.customer_email,
        fullName: config.customer_name
      }
    });

    // Open checkout
    checkout.open((result) => {
      if (result.status === 'APPROVED') {
        onSuccess(result);
      } else {
        onError(result);
      }
    });

    return () => checkout.close();
  }, [config]);

  return <div id="wompi-checkout"></div>;
}
```

### Option 3: Custom Integration (Tokenized)

For complete control, tokenize cards yourself:

```javascript
// Load Wompi.js
const script = document.createElement('script');
script.src = 'https://checkout.wompi.co/wompi.js';
document.body.appendChild(script);

// Tokenize card
async function tokenizeCard(cardData) {
  const wompi = new window.Wompi.Card({
    publicKey: 'pub_test_xxxxx'
  });

  const token = await wompi.createToken({
    number: cardData.number,
    cvc: cardData.cvc,
    exp_month: cardData.exp_month,
    exp_year: cardData.exp_year,
    card_holder: cardData.card_holder
  });

  return token;
}

// Use token in transaction
async function createTransaction(matchId, cardToken, acceptanceToken) {
  const response = await fetch('/api/payments/wompi/create-transaction', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      match_id: matchId,
      payment_method: {
        type: 'CARD',
        token: cardToken
      },
      acceptance_token: acceptanceToken
    })
  });

  return await response.json();
}
```

---

## Webhook Configuration

### 1. Create Webhook Endpoint

Already implemented in `backend/src/api/payments-wompi.js`:

```javascript
POST /api/payments/wompi/webhook
```

### 2. Configure in Wompi Dashboard

1. Log in to https://comercios.wompi.co/
2. Go to **Settings** → **Webhooks**
3. Add endpoint: `https://api.yourdomain.com/api/payments/wompi/webhook`
4. Select events:
   - `transaction.updated`
5. Save configuration

### 3. Webhook Payload

Wompi sends this payload when transaction updates:

```json
{
  "event": "transaction.updated",
  "data": {
    "transaction": {
      "id": "1234-567890",
      "amount_in_cents": 400000,
      "currency": "COP",
      "customer_email": "user@example.com",
      "payment_method_type": "CARD",
      "reference": "PM-xxxxx-xxxxx-1234567890",
      "status": "APPROVED",
      "created_at": "2025-12-01T12:00:00Z",
      "finalized_at": "2025-12-01T12:01:00Z",
      "status_message": null
    }
  },
  "sent_at": "2025-12-01T12:01:05Z"
}
```

### 4. Signature Verification

Always verify webhook signatures:

```javascript
const signature = req.headers['x-wompi-signature'];

if (!wompiService.verifyWebhookSignature(event, signature)) {
  return res.status(400).json({ error: 'Invalid signature' });
}
```

Signature calculation:
```
checksum = SHA256(
  id + status + amount_in_cents + currency + reference + finalized_at + integrity_secret
)
```

---

## Payment Methods

### 1. Credit/Debit Cards

**Supported:**
- Visa
- Mastercard
- American Express
- Diners Club

**Implementation:**
```javascript
{
  payment_method: {
    type: 'CARD',
    token: 'tok_xxxxx',  // From Wompi.js tokenization
    installments: 1       // Number of installments
  }
}
```

### 2. Nequi

Popular Colombian mobile wallet.

**Implementation:**
```javascript
{
  payment_method: {
    type: 'NEQUI',
    phone_number: '+573001234567'
  }
}
```

**Flow:**
1. User enters phone number
2. Receives push notification in Nequi app
3. Approves payment in app
4. Transaction completes

### 3. PSE (Bank Transfers)

Colombian bank transfer system.

**Implementation:**
```javascript
{
  payment_method: {
    type: 'PSE',
    user_type: 0,           // 0 = Person, 1 = Business
    user_legal_id_type: 'CC', // CC, CE, NIT, etc.
    user_legal_id: '123456789',
    financial_institution_code: '1234', // Bank code
    payment_description: 'Profile unlock'
  }
}
```

**Supported Banks:**
- Bancolombia
- Davivienda
- BBVA
- Banco de Bogotá
- And 20+ more

### 4. Bancolombia Transfer

Direct Bancolombia transfer.

**Implementation:**
```javascript
{
  payment_method: {
    type: 'BANCOLOMBIA_TRANSFER'
  }
}
```

---

## Testing

### Test Environment

**Sandbox API**: `https://sandbox.wompi.co/v1`

Set in `.env`:
```bash
WOMPI_ENVIRONMENT=sandbox
```

### Test Cards

| Card Type | Number | Result |
|-----------|--------|--------|
| **Visa (Approved)** | 4242 4242 4242 4242 | APPROVED |
| **Visa (Declined)** | 4000 0000 0000 0002 | DECLINED |
| **Mastercard** | 5555 5555 5555 4444 | APPROVED |
| **Amex** | 3782 822463 10005 | APPROVED |

**Additional Info:**
- CVV: Any 3-4 digits
- Expiry: Any future date
- Name: Any name

### Test Nequi

**Test Phone**: `+573001234567`
- Always approves in sandbox

### Test PSE

**Test Bank**: Code `1234`
- Always approves in sandbox

### Testing Checklist

- [ ] Card payment (approved)
- [ ] Card payment (declined)
- [ ] Nequi payment
- [ ] PSE bank transfer
- [ ] Webhook reception
- [ ] Webhook signature verification
- [ ] Transaction status polling
- [ ] Refund/void (within 24h)
- [ ] Payment link expiration
- [ ] Error handling
- [ ] Currency conversion (USD to COP)

---

## Production Checklist

### 1. Environment Variables

- [ ] `WOMPI_PUBLIC_KEY` - Production public key
- [ ] `WOMPI_PRIVATE_KEY` - Production private key
- [ ] `WOMPI_INTEGRITY_SECRET` - Production secret
- [ ] `WOMPI_ENVIRONMENT=production`
- [ ] `USD_TO_COP_RATE` - Current exchange rate

### 2. Wompi Configuration

- [ ] Account verified and approved
- [ ] Bank account connected
- [ ] Webhook URL configured
- [ ] SSL certificate valid
- [ ] Payment methods enabled

### 3. Security

- [ ] Webhook signature verification enabled
- [ ] API keys stored securely (environment variables)
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints

### 4. Testing

- [ ] All payment methods tested
- [ ] Webhooks received successfully
- [ ] Failed payments handled correctly
- [ ] Edge cases covered
- [ ] Load testing completed

### 5. Monitoring

- [ ] Error logging configured
- [ ] Payment tracking dashboard
- [ ] Webhook failure alerts
- [ ] Transaction monitoring

### 6. Legal & Compliance

- [ ] Terms of service updated
- [ ] Privacy policy includes payment processing
- [ ] User consent for charges
- [ ] Refund policy documented

---

## Troubleshooting

### Issue: Transaction Declined

**Possible Causes:**
- Insufficient funds
- Invalid card
- Bank rejection
- Fraud detection

**Solution:**
```javascript
if (transaction.status === 'DECLINED') {
  const message = transaction.status_message || 'Payment declined';
  // Show user-friendly error
  // Suggest alternative payment method
}
```

### Issue: Webhook Not Received

**Debug Steps:**
1. Check webhook URL is publicly accessible
2. Verify SSL certificate is valid
3. Test with Wompi webhook simulator
4. Check firewall/security rules
5. Review server logs

**Test Webhook:**
```bash
curl -X POST https://api.yourdomain.com/api/payments/wompi/webhook \
  -H "Content-Type: application/json" \
  -H "x-wompi-signature: test_signature" \
  -d '{
    "event": "transaction.updated",
    "data": {...}
  }'
```

### Issue: Signature Verification Fails

**Check:**
1. `WOMPI_INTEGRITY_SECRET` is correct
2. Concatenation order matches Wompi spec
3. Using SHA256 hash
4. Comparing strings correctly

**Debug:**
```javascript
console.log('Computed signature:', computedSignature);
console.log('Received signature:', receivedSignature);
console.log('Match:', computedSignature === receivedSignature);
```

### Issue: Currency Conversion Errors

**Update Exchange Rate:**
```bash
# Get current rate from API
curl https://api.exchangerate-api.com/v4/latest/USD

# Update .env
USD_TO_COP_RATE=4200  # Example
```

---

## Best Practices

### 1. Idempotency

Use unique references for each transaction:

```javascript
const reference = `PM-${userId}-${matchId}-${Date.now()}`;
```

### 2. Error Handling

Always handle errors gracefully:

```javascript
try {
  const transaction = await wompiService.createTransaction(data);
} catch (error) {
  if (error.message.includes('insufficient funds')) {
    // Show specific message
  } else {
    // Generic error
  }
}
```

### 3. Polling vs Webhooks

Use both for reliability:

```javascript
// 1. Create transaction
const tx = await createTransaction();

// 2. Poll status (backup if webhook fails)
const pollInterval = setInterval(async () => {
  const status = await getTransactionStatus(tx.transaction_id);

  if (status.status === 'APPROVED') {
    clearInterval(pollInterval);
    handleSuccess(status);
  } else if (status.status === 'DECLINED') {
    clearInterval(pollInterval);
    handleFailure(status);
  }
}, 5000); // Poll every 5 seconds

// 3. Stop polling after 5 minutes
setTimeout(() => clearInterval(pollInterval), 300000);
```

### 4. User Experience

- Show loading states
- Provide clear error messages
- Allow payment method switching
- Display price in local currency (COP)
- Show USD equivalent

---

## Support

**Wompi Support:**
- Email: soporte@wompi.co
- Phone: +57 1 508 8888
- Hours: Mon-Fri 8am-6pm COT

**Documentation:**
- API Docs: https://docs.wompi.co/
- Status Page: https://status.wompi.co/

**PersonalityMatch:**
- Issues: GitHub Issues
- Email: support@personalitymatch.com

---

**Wompi Integration Complete!** 🎉

Lower fees, better UX for Colombian users, seamless integration.
