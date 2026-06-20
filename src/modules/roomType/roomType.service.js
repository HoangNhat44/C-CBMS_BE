const RoomType = require("../../models/roomType.model");

class RoomTypeService {
  async getAllRoomTypes() {
    try {
      const roomTypes = await RoomType.find({ isActive: true }).sort({ name: 1 });
      return { success: true, data: roomTypes };
    } catch (error) {
      throw new Error(`Failed to get room types: ${error.message}`);
    }
  }
}

module.exports = new RoomTypeService();
