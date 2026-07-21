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

  async checkTimeOverlap(startTime, endTime, excludeSlotId = null) {
    const timeToMinutes = (tStr) => {
      if (!tStr) return 0;
      const [h, m] = tStr.split(":").map(Number);
      return h * 60 + m;
    };

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    if (startMin >= endMin) {
      return {
        hasOverlap: true,
        message: "Giờ bắt đầu phải nhỏ hơn giờ kết thúc (ví dụ: 08:00 - 10:00)."
      };
    }

    const allSlots = await Slot.find();
    for (const slot of allSlots) {
      if (excludeSlotId && slot._id.toString() === excludeSlotId.toString()) {
        continue;
      }
      const sMin = timeToMinutes(slot.startTime);
      const eMin = timeToMinutes(slot.endTime);

      if (startMin < eMin && endMin > sMin) {
        return {
          hasOverlap: true,
          message: `Khung giờ (${startTime} - ${endTime}) bị trùng/gối lên khung giờ "${slot.name}" (${slot.startTime} - ${slot.endTime}). Vui lòng chọn thời gian khác!`
        };
      }
    }
    return { hasOverlap: false };
  }

  async createSlot(slotData) {
    try {
      // Validate time overlap
      const overlapCheck = await this.checkTimeOverlap(slotData.startTime, slotData.endTime);
      if (overlapCheck.hasOverlap) {
        return {
          success: false,
          message: overlapCheck.message
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
      const existingSlot = await Slot.findById(slotId);
      if (!existingSlot) {
        return {
          success: false,
          message: "Slot not found",
        };
      }

      const newStartTime = updateData.startTime || existingSlot.startTime;
      const newEndTime = updateData.endTime || existingSlot.endTime;

      if (updateData.startTime || updateData.endTime) {
        const overlapCheck = await this.checkTimeOverlap(newStartTime, newEndTime, slotId);
        if (overlapCheck.hasOverlap) {
          return {
            success: false,
            message: overlapCheck.message
          };
        }
      }

      const allowedUpdates = {};
      if (updateData.hasOwnProperty("name")) allowedUpdates.name = updateData.name;
      if (updateData.hasOwnProperty("startTime")) allowedUpdates.startTime = updateData.startTime;
      if (updateData.hasOwnProperty("endTime")) allowedUpdates.endTime = updateData.endTime;
      if (updateData.hasOwnProperty("timeType")) allowedUpdates.timeType = updateData.timeType;
      if (updateData.hasOwnProperty("isActive")) allowedUpdates.isActive = updateData.isActive;

      const slot = await Slot.findByIdAndUpdate(slotId, allowedUpdates, {
        returnDocument: 'after',
        runValidators: true,
      });

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
