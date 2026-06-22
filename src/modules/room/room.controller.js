const roomService = require("./room.service");

class RoomController {
  async createRoom(req, res) {
    try {
      const result = await roomService.createRoom(req.body);
      res.status(201).json({
        message: "Create room successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to create room",
        error: error.message,
      });
    }
  }

  async getAllRooms(req, res) {
    try {
      const filter = {};
      if (req.query.branchId) {
        filter.branchId = req.query.branchId;
      }
      if (req.query.status) {
        filter.status = req.query.status;
      }

      const result = await roomService.getAllRooms(filter);
      res.json({
        message: "Get rooms successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get rooms",
        error: error.message,
      });
    }
  }

  async getRoomById(req, res) {
    try {
      const result = await roomService.getRoomById(req.params.id);
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Get room successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get room",
        error: error.message,
      });
    }
  }

  async updateRoom(req, res) {
    try {
      const result = await roomService.updateRoom(req.params.id, req.body);
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Update room successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update room",
        error: error.message,
      });
    }
  }

  async updateRoomStatus(req, res) {
    try {
      const result = await roomService.updateRoomStatus(req.params.id, req.body.status);
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Update room status successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update room status",
        error: error.message,
      });
    }
  }
}

module.exports = new RoomController();
