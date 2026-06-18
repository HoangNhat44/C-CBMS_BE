const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    method: {
      type: String,
      enum: ["cash", "bank_transfer", "momo", "vnpay", "payos"],
      default: "cash",
    },

    paymentType: {
      type: String,
      enum: ["deposit", "remaining", "full"],
      default: "full",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "success",
        "failed",
        "refunded",
        "cancelled",
        "expired",
        "processing",
        "partially_paid"
      ],
      default: "pending",
    },

    orderCode: {
      type: Number,
      unique: true,
      sparse: true,
    },

    paymentLinkId: {
      type: String,
      default: "",
    },

    checkoutUrl: {
      type: String,
      default: "",
    },

    qrCode: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    expiredAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    rawWebhook: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "payments",
  }
);

// Add index on bookingId for query optimization since it is no longer unique
paymentSchema.index({ bookingId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);