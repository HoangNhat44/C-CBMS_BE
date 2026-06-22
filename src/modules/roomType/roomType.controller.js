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

  async createRoomType(req, res) {
    try {
      const result = await roomTypeService.createRoomType(req.body);
      res.status(201).json({
        message: "Room type created successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create room type",
        error: error.message,
      });
    }
  }

  async updateRoomType(req, res) {
    try {
      const result = await roomTypeService.updateRoomType(req.params.id, req.body);
      res.json({
        message: "Room type updated successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update room type",
        error: error.message,
      });
    }
  }

}

module.exports = new RoomTypeController();
