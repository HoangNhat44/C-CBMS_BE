const roomPriceService = require("./roomPrice.service");

class RoomPriceController {
  async getMatrix(req, res) {
    try {
      const { branchId, dayType } = req.query;
      const result = await roomPriceService.getMatrix(branchId, dayType || "weekday");
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateMatrix(req, res) {
    try {
      const { branchId, dayType, updates, reason } = req.body;
      const userId = req.user?._id || req.user?.id;

      const result = await roomPriceService.updateMatrix(
        branchId,
        dayType,
        updates,
        userId,
        reason
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getHistory(req, res) {
    try {
      const { branchId, roomTypeId, dayType, page, limit } = req.query;
      const result = await roomPriceService.getHistory({
        branchId,
        roomTypeId,
        dayType,
        page,
        limit,
      });

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new RoomPriceController();
