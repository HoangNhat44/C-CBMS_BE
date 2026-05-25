const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
    },

    bookingDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    totalHours: {
      type: Number,
      required: true,
      min: 1,
    },

    dayType: {
      type: String,
      enum: ["weekday", "weekend", "holiday"],
      required: true,
    },

    roomPriceSnapshot: {
      roomTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomType",
      },

      slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Slot",
      },

      pricePerHour: {
        type: Number,
        required: true,
      },
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },

        name: {
          type: String,
          required: true,
        },

        price: {
          type: Number,
          required: true,
        },

        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },

        total: {
          type: Number,
          required: true,
        },
      },
    ],

    roomTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    productTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    finalTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "refunded"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },

    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "bookings",
  }
);

bookingSchema.index({ roomId: 1, bookingDate: 1, slotId: 1 });
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ branchId: 1 });

module.exports = mongoose.model("Booking", bookingSchema);