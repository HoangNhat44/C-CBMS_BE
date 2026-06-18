const Promotion = require("../../models/promotion.model");

class PromotionService {
  async getAllPromotions() {
    try {
      const promotions = await Promotion.find().populate("branchIds", "name").sort({ createdAt: -1 });
      return {
        success: true,
        data: promotions,
      };
    } catch (error) {
      throw new Error(`Failed to get promotions: ${error.message}`);
    }
  }

  async createPromotion(data) {
    try {
      let existing = null;
      if (data.code) {
        existing = await Promotion.findOne({ code: data.code.toUpperCase() });
        if (existing) {
          return {
            success: false,
            message: "Mã khuyến mãi đã tồn tại",
          };
        }
      }

      const promotion = new Promotion({
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined
      });

      await promotion.save();

      return {
        success: true,
        message: "Tạo khuyến mãi thành công",
        data: promotion,
      };
    } catch (error) {
      throw new Error(`Failed to create promotion: ${error.message}`);
    }
  }

  async updatePromotion(id, data) {
    try {
      // Check code duplication
      if (data.code) {
        const existing = await Promotion.findOne({ code: data.code.toUpperCase(), _id: { $ne: id } });
        if (existing) {
          return {
            success: false,
            message: "Mã khuyến mãi đã tồn tại ở mục khác",
          };
        }
        data.code = data.code.toUpperCase();
      }

      const promotion = await Promotion.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate("branchIds", "name");
      
      if (!promotion) {
        return {
          success: false,
          message: "Không tìm thấy khuyến mãi",
        };
      }

      return {
        success: true,
        message: "Cập nhật khuyến mãi thành công",
        data: promotion,
      };
    } catch (error) {
      throw new Error(`Failed to update promotion: ${error.message}`);
    }
  }
}

module.exports = new PromotionService();
