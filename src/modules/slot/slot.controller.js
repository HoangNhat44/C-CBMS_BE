const slotService = require("./slot.services");

class SlotController {
  async getAllSlots(req, res) {
    try {
      const result = await slotService.getAllSlots();
      res.json({
        message: "Get slots successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get slots",
        error: error.message,
      });
    }
  }

  async getSlotById(req, res) {
    try {
      const { id } = req.params;
      const result = await slotService.getSlotById(id);
      if (!result.success) {
        return res.status(404).json(result);
      }
      res.json({
        message: "Get slot successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get slot",
        error: error.message,
      });
    }
  }

  async createSlot(req, res) {
    try {
      const result = await slotService.createSlot(req.body);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.status(201).json({
        message: "Create slot successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to create slot",
        error: error.message,
      });
    }
  }

  async updateSlot(req, res) {
    try {
      const { id } = req.params;
      const result = await slotService.updateSlot(id, req.body);
      if (!result.success) {
        return res.status(404).json(result);
      }
      res.json({
        message: "Update slot successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update slot",
        error: error.message,
      });
    }
  }

  async deleteSlot(req, res) {
    try {
      const { id } = req.params;
      const result = await slotService.deleteSlot(id);
      if (!result.success) {
        return res.status(404).json(result);
      }
      res.json({
        message: "Deactivate slot successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to deactivate slot",
        error: error.message,
      });
    }
  }
}

module.exports = new SlotController();
