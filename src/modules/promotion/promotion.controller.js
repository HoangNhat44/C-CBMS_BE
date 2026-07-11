const promotionService = require("./promotion.service");

class PromotionController {
  async getAllPromotions(req, res) {
    try {
      const { branchId, isManagement } = req.query;

      if (isManagement === 'true') {
        const user = req.user;
        let hasViewPerm = false;
        if (user && user.roleId && user.roleId.permissions) {
          hasViewPerm = user.roleId.permissions.some(p => p.code === "VIEW_PROMOTION");
        }
        if (!hasViewPerm) {
          return res.status(403).json({ success: false, message: "Forbidden. Requires VIEW_PROMOTION permission." });
        }
      }

      const result = await promotionService.getAllPromotions(branchId, isManagement === 'true');
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

  async applyPromotion(req, res) {
    try {
      const { code, branchId } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập mã giảm giá" });
      }
      const result = await promotionService.applyPromotion(code, branchId);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to apply promotion",
        error: error.message,
      });
    }
  }

  async calculateDiscount(req, res) {
    try {
      const { originalPrice, promotionIds } = req.body;
      if (originalPrice === undefined || originalPrice < 0) {
        return res.status(400).json({ success: false, message: "Giá trị gốc không hợp lệ" });
      }
      const result = await promotionService.calculateDiscount(originalPrice, promotionIds);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to calculate discount",
        error: error.message,
      });
    }
  }

  async confirmUsage(req, res) {
    try {
      const { promotionIds } = req.body;
      const result = await promotionService.confirmUsage(promotionIds);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to confirm usage",
        error: error.message,
      });
    }
  }

  async revertUsage(req, res) {
    try {
      const { promotionIds } = req.body;
      const result = await promotionService.revertUsage(promotionIds);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to revert usage",
        error: error.message,
      });
    }
  }
}

module.exports = new PromotionController();
