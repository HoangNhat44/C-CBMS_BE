const mongoose = require("mongoose");

const roomPriceSchema = new mongoose.Schema(
  {
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
      enum: ["weekday", "weekend", "holiday"],
      required: true,
    },

    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "room_prices",
  }
);

roomPriceSchema.index(
  { branchId: 1, roomTypeId: 1, slotId: 1, dayType: 1 },
  { unique: true }
);

module.exports = mongoose.model("RoomPrice", roomPriceSchema);