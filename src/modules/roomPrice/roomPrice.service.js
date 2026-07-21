const RoomPrice = require("../../models/roomPrice.model");
const RoomPriceHistory = require("../../models/roomPriceHistory.model");
const RoomType = require("../../models/roomType.model");
const Slot = require("../../models/slot.model");
const Branch = require("../../models/branch.model");

class RoomPriceService {
  async getMatrix(branchId, dayType = "weekday") {
    try {
      const roomTypes = await RoomType.find({ isActive: true }).sort({ name: 1 });
      const slots = await Slot.find({ isActive: true }).sort({ startTime: 1 });

      const filter = { dayType };
      if (branchId) {
        filter.branchId = branchId;
      }

      const existingPrices = await RoomPrice.find(filter);

      // Convert to key-value lookup map: "roomTypeId_slotId" => pricePerHour
      const priceMap = {};
      existingPrices.forEach((p) => {
        const key = `${p.roomTypeId}_${p.slotId}`;
        priceMap[key] = p.pricePerHour;
      });

      return {
        success: true,
        data: {
          branchId,
          dayType,
          roomTypes,
          slots,
          priceMap,
          prices: existingPrices,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get room price matrix: ${error.message}`);
    }
  }

  async updateMatrix(branchId, dayType, updates = [], userId = null, reason = "") {
    try {
      if (!branchId) {
        return { success: false, message: "Vui lòng chọn chi nhánh!" };
      }
      if (!["weekday", "weekend"].includes(dayType)) {
        return { success: false, message: "Loại ngày không hợp lệ! (chỉ chọn weekday hoặc weekend)" };
      }

      const historyLogs = [];

      for (const item of updates) {
        const { roomTypeId, slotId, pricePerHour } = item;
        const newPrice = Math.max(0, Number(pricePerHour) || 0);

        const existing = await RoomPrice.findOne({
          branchId,
          roomTypeId,
          slotId,
          dayType,
        });

        const oldPrice = existing ? existing.pricePerHour : 0;

        if (!existing || oldPrice !== newPrice) {
          const updatedRecord = await RoomPrice.findOneAndUpdate(
            { branchId, roomTypeId, slotId, dayType },
            { pricePerHour: newPrice, isActive: true },
            { upsert: true, returnDocument: 'after' }
          );

          historyLogs.push({
            roomPriceId: updatedRecord._id,
            branchId,
            roomTypeId,
            slotId,
            dayType,
            oldPricePerHour: oldPrice,
            newPricePerHour: newPrice,
            difference: newPrice - oldPrice,
            updatedBy: userId,
            reason: reason || (existing ? "Điều chỉnh đơn giá" : "Thiết lập đơn giá ban đầu"),
          });
        }
      }

      if (historyLogs.length > 0) {
        await RoomPriceHistory.insertMany(historyLogs);
      }

      return {
        success: true,
        message: `Đã cập nhật ${historyLogs.length} đơn giá và lưu nhật ký thành công!`,
        updatedCount: historyLogs.length,
      };
    } catch (error) {
      throw new Error(`Failed to update room price matrix: ${error.message}`);
    }
  }

  async getHistory({ branchId, roomTypeId, dayType, page = 1, limit = 10 }) {
    try {
      const filter = {};
      if (branchId) filter.branchId = branchId;
      if (roomTypeId) filter.roomTypeId = roomTypeId;
      if (dayType) filter.dayType = dayType;

      const skip = (Math.max(1, page) - 1) * limit;

      const [total, histories] = await Promise.all([
        RoomPriceHistory.countDocuments(filter),
        RoomPriceHistory.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("branchId", "name")
          .populate("roomTypeId", "name")
          .populate("slotId", "name startTime endTime timeType")
          .populate("updatedBy", "fullName name email username"),
      ]);

      return {
        success: true,
        data: histories,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get room price history: ${error.message}`);
    }
  }
}

module.exports = new RoomPriceService();
