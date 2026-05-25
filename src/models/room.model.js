const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
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

    roomName: {
      type: String,
      required: true,
      trim: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    images: [
      {
        type: String,
      },
    ],

    facilities: [
      {
        type: String,
      },
    ],

    status: {
      type: String,
      enum: ["available", "maintenance", "inactive"],
      default: "available",
    },
  },
  {
    timestamps: true,
    collection: "rooms",
  }
);

module.exports = mongoose.model("Room", roomSchema);