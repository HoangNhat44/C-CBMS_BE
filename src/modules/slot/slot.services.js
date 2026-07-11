const Slot = require("../../models/slot.model");

class SlotService {
  async getAllSlots() {
    try {
      const slots = await Slot.find().sort({ startTime: 1 });
      return {
        success: true,
        data: slots,
      };
    } catch (error) {
      throw new Error(`Failed to get slots: ${error.message}`);
    }
  }

  async getSlotById(slotId) {
    try {
      const slot = await Slot.findById(slotId);
      if (!slot) {
        return {
          success: false,
          message: "Slot not found",
        };
      }
      return {
        success: true,
        data: slot,
      };
    } catch (error) {
      throw new Error(`Failed to get slot: ${error.message}`);
    }
  }

  async createSlot(slotData) {
    try {
      // 1. Check if a slot with the same startTime and endTime already exists
      const existingSlot = await Slot.findOne({
        startTime: slotData.startTime,
        endTime: slotData.endTime,
      });

      if (existingSlot) {
        return {
          success: false,
          message: "Khung giờ slot này đã tồn tại, không thể tạo trùng.",
        };
      }

      const slot = await Slot.create(slotData);
      return {
        success: true,
        data: slot,
      };
    } catch (error) {
      throw new Error(`Failed to create slot: ${error.message}`);
    }
  }

  async updateSlot(slotId, updateData) {
    try {
      // 2. Restrict updates to only allow name, timeType, and isActive
      const allowedUpdates = {};
      if (updateData.hasOwnProperty("name")) allowedUpdates.name = updateData.name;
      if (updateData.hasOwnProperty("timeType")) allowedUpdates.timeType = updateData.timeType;
      if (updateData.hasOwnProperty("isActive")) allowedUpdates.isActive = updateData.isActive;

      const slot = await Slot.findByIdAndUpdate(slotId, allowedUpdates, {
        returnDocument: 'after',
        runValidators: true,
      });

      if (!slot) {
        return {
          success: false,
          message: "Slot not found",
        };
      }

      return {
        success: true,
        data: slot,
      };
    } catch (error) {
      throw new Error(`Failed to update slot: ${error.message}`);
    }
  }

  async updateSlotStatus(slotId, isActive) {
    try {
      const slot = await Slot.findByIdAndUpdate(
        slotId,
        { isActive },
        { returnDocument: 'after', runValidators: true }
      );

      if (!slot) {
        return {
          success: false,
          message: "Slot not found",
        };
      }

      return {
        success: true,
        data: slot,
      };
    } catch (error) {
      throw new Error(`Failed to update slot status: ${error.message}`);
    }
  }
}

module.exports = new SlotService();
