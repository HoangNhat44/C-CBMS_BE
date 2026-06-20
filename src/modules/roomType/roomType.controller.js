const roomTypeService = require("./roomType.service");

class RoomTypeController {
  async getAllRoomTypes(req, res) {
    try {
      const result = await roomTypeService.getAllRoomTypes();
      res.json({
        message: "Get room types successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get room types",
        error: error.message,
      });
    }
  }
}

module.exports = new RoomTypeController();
