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

  async getPublicRoomTypes(req, res) {
    try {
      const result = await roomTypeService.getPublicRoomTypes();
      res.json({
        message: "Get public room types successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get public room types",
        error: error.message,
      });
    }
  }

  async createRoomType(req, res) {
    try {
      const data = { ...req.body };

      // Parse capacity to number
      if (data.capacity) data.capacity = Number(data.capacity);

      // Parse isActive from string to boolean (FormData sends strings)
      if (typeof data.isActive === "string") {
        data.isActive = data.isActive === "true";
      }

      // Handle uploaded image file
      if (req.file) {
        data.image = `/uploads/${req.file.filename}`;
      }

      const result = await roomTypeService.createRoomType(data);
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
      const data = { ...req.body };

      // Parse capacity to number
      if (data.capacity) data.capacity = Number(data.capacity);

      // Parse isActive from string to boolean (FormData sends strings)
      if (typeof data.isActive === "string") {
        data.isActive = data.isActive === "true";
      }

      // Handle uploaded image file
      if (req.file) {
        data.image = `/uploads/${req.file.filename}`;
      }

      const result = await roomTypeService.updateRoomType(req.params.id, data);
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
