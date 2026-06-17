const promotionService = require("./promotion.service");

class PromotionController {
  async getAllPromotions(req, res) {
    try {
      const result = await promotionService.getAllPromotions();
      res.json({
        message: "Get promotions successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get promotions",
        error: error.message,
      });
    }
  }

  async createPromotion(req, res) {
    try {
      const data = req.body;
      const result = await promotionService.createPromotion(data);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create promotion",
        error: error.message,
      });
    }
  }

  async updatePromotion(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await promotionService.updatePromotion(id, data);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update promotion",
        error: error.message,
      });
    }
  }
}

module.exports = new PromotionController();
