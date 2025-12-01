const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    payment_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onDelete: 'CASCADE'
    },

    match_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'matches',
        key: 'match_id'
      },
      onDelete: 'SET NULL'
    },

    // Stripe payment details
    stripe_payment_intent_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'Stripe PaymentIntent ID'
    },

    stripe_charge_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Stripe Charge ID after successful payment'
    },

    // Payment amount
    amount_cents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Amount in cents (100 = $1.00)'
    },

    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'usd'
    },

    // Payment status
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing',
        'succeeded',
        'failed',
        'canceled',
        'refunded'
      ),
      defaultValue: 'pending',
      allowNull: false
    },

    // Payment method
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'card, google_pay, apple_pay, etc.'
    },

    last_4_digits: {
      type: DataTypes.STRING(4),
      allowNull: true,
      comment: 'Last 4 digits of card for reference'
    },

    card_brand: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'visa, mastercard, amex, etc.'
    },

    // Transaction metadata
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: 'Unlock profile contact'
    },

    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional payment metadata from Stripe'
    },

    // Timestamps
    initiated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },

    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    failed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Error tracking
    error_code: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Refund information
    refund_amount_cents: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },

    refund_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Receipt
    receipt_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Stripe receipt URL'
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['match_id'] },
      { fields: ['stripe_payment_intent_id'], unique: true },
      { fields: ['status'] },
      { fields: ['initiated_at'] },
      { fields: ['completed_at'] }
    ]
  });

  // Class methods
  Payment.findByStripeIntentId = async function(intentId) {
    return await this.findOne({
      where: { stripe_payment_intent_id: intentId }
    });
  };

  Payment.getUserPaymentHistory = async function(userId, limit = 50) {
    return await this.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit
    });
  };

  Payment.getSuccessfulPaymentsCount = async function(userId) {
    return await this.count({
      where: {
        user_id: userId,
        status: 'succeeded'
      }
    });
  };

  // Instance methods
  Payment.prototype.markSucceeded = async function(chargeId, receiptUrl) {
    this.status = 'succeeded';
    this.stripe_charge_id = chargeId;
    this.receipt_url = receiptUrl;
    this.completed_at = new Date();
    await this.save();
  };

  Payment.prototype.markFailed = async function(errorCode, errorMessage) {
    this.status = 'failed';
    this.error_code = errorCode;
    this.error_message = errorMessage;
    this.failed_at = new Date();
    await this.save();
  };

  Payment.prototype.markRefunded = async function(refundAmount, reason) {
    this.status = 'refunded';
    this.refund_amount_cents = refundAmount;
    this.refund_reason = reason;
    this.refunded_at = new Date();
    await this.save();
  };

  return Payment;
};
