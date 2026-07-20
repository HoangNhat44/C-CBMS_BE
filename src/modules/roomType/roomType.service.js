const RoomType = require("../../models/roomType.model");
const RoomPrice = require("../../models/roomPrice.model");
const Slot = require("../../models/slot.model");

class RoomTypeService {
  async getAllRoomTypes() {
    try {
      // Lấy TẤT CẢ room type, kể cả isActive: false (tạm dừng)
      // để giao diện hiển thị đầy đủ và button toggle hoạt động đúng
      const roomTypes = await RoomType.find().sort({ name: 1 });
      return { success: true, data: roomTypes };
    } catch (error) {
      throw new Error(`Failed to get room types: ${error.message}`);
    }
  }

  async getPublicRoomTypes() {
    try {
      const roomTypes = await RoomType.find({}).lean();
      
      const standardSlots = await Slot.find({ timeType: 'standard' }).select('_id').lean();
      const standardSlotIds = standardSlots.map(s => s._id);

      for (let rt of roomTypes) {
        let prices = await RoomPrice.find({
          roomTypeId: rt._id,
          dayType: 'weekday',
          slotId: { $in: standardSlotIds },
          isActive: true
        }).sort({ pricePerHour: 1 }).limit(1).lean();

        // Nếu không có giá ngày thường, lấy thử một giá bất kỳ đang hoạt động của phòng này
        if (prices.length === 0) {
          prices = await RoomPrice.find({
            roomTypeId: rt._id,
            isActive: true
          }).sort({ pricePerHour: 1 }).limit(1).lean();
        }

        if (prices.length > 0) {
          rt.price = prices[0].pricePerHour;
        } else {
          rt.price = 0;
        }
      }
      
      return { success: true, data: roomTypes };
    } catch (error) {
      throw new Error(`Failed to get public room types: ${error.message}`);
    }
  }

  async createRoomType(data) {
    try {
      const roomType = new RoomType(data);
      const savedRoomType = await roomType.save();
      return { success: true, data: savedRoomType };
    } catch (error) {
      throw new Error(`Failed to create room type: ${error.message}`);
    }
  }

  async updateRoomType(id, data) {
    try {
      const roomType = await RoomType.findByIdAndUpdate(id, data, { returnDocument: 'after' });
      if (!roomType) {
        throw new Error("Room type not found");
      }
      return { success: true, data: roomType };
    } catch (error) {
      throw new Error(`Failed to update room type: ${error.message}`);
    }
  }
}

module.exports = new RoomTypeService();

