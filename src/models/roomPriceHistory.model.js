const mongoose = require("mongoose");

const roomPriceHistorySchema = new mongoose.Schema(
  {
    roomPriceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomPrice",
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
      required: true,
    },

    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
    },

    dayType: {
      type: String,
      enum: ["weekday", "weekend"],
      required: true,
    },

    oldPricePerHour: {
      type: Number,
      default: 0,
    },

    newPricePerHour: {
      type: Number,
      required: true,
    },

    difference: {
      type: Number,
      default: 0,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "room_price_histories",
  }
);

module.exports = mongoose.model("RoomPriceHistory", roomPriceHistorySchema);
