const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      default: "percent",
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    branchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxUsage: {
      type: Number,
      default: null,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "promotions",
  }
);

module.exports = mongoose.model("Promotion", promotionSchema);