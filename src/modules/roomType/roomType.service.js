const RoomType = require("../../models/roomType.model");

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
      const roomType = await RoomType.findByIdAndUpdate(id, data, { new: true });
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

