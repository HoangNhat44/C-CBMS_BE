const Promotion = require("../../models/promotion.model");

class PromotionService {
  async getAllPromotions(branchId) {
    try {
      let query = {};
      if (branchId) {
        const now = new Date();
        query.isActive = true;
        query.$and = [
          {
            $or: [
              { branchIds: { $size: 0 } },
              { branchIds: branchId }
            ]
          },
          {
            $or: [
              { code: { $exists: false } },
              { code: "" },
              { code: null }
            ]
          },
          {
            $or: [
              { startDate: { $exists: false } },
              { startDate: null },
              { startDate: { $lte: now } }
            ]
          },
          {
            $or: [
              { endDate: { $exists: false } },
              { endDate: null },
              { endDate: { $gte: now } }
            ]
          },
          {
            $or: [
              { maxUsage: null },
              { maxUsage: { $exists: false } },
              { $expr: { $lt: ["$usedCount", "$maxUsage"] } }
            ]
          }
        ];
      }
      const promotions = await Promotion.find(query).populate("branchIds", "name").sort({ createdAt: -1 });
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
      const currentPromotion = await Promotion.findById(id);
      if (!currentPromotion) {
        return {
          success: false,
          message: "Không tìm thấy khuyến mãi",
        };
      }

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

      if (data.isActive !== undefined) {
        const newIsActive = data.isActive === true || data.isActive === "true";
        if (newIsActive && currentPromotion.isActive === false) {
          data.usedCount = 0;
        }
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

  async applyPromotion(code, branchId) {
    try {
      const promotion = await Promotion.findOne({ code: code.toUpperCase() });
      if (!promotion) {
        return { success: false, message: "Mã giảm giá không tồn tại!" };
      }

      if (!promotion.isActive) {
        return { success: false, message: "Mã giảm giá đã ngừng hoạt động!" };
      }

      const now = new Date();
      if (promotion.startDate && now < new Date(promotion.startDate)) {
        return { success: false, message: "Mã giảm giá chưa đến thời gian áp dụng!" };
      }
      if (promotion.endDate && now > new Date(promotion.endDate)) {
        return { success: false, message: "Mã giảm giá đã hết hạn!" };
      }

      if (branchId && promotion.branchIds && promotion.branchIds.length > 0) {
        const isMatch = promotion.branchIds.some(b => b.toString() === branchId.toString());
        if (!isMatch) {
          return { success: false, message: "Mã giảm giá không áp dụng cho chi nhánh này!" };
        }
      }

      return {
        success: true,
        message: "Áp dụng mã giảm giá thành công!",
        data: promotion,
      };
    } catch (error) {
      throw new Error(`Failed to apply promotion: ${error.message}`);
    }
  }

  async calculateDiscount(originalPrice, promotionIds) {
    try {
      if (!promotionIds || promotionIds.length === 0) {
        return { success: true, data: { discountAmount: 0, finalTotal: originalPrice } };
      }

      const promotions = await Promotion.find({ _id: { $in: promotionIds } });
      let currentTotal = originalPrice;
      let calculatedDiscount = 0;
      let validPromotions = [];

      const now = new Date();
      for (const promo of promotions) {
        // Skip invalid promos for calculation
        if (!promo.isActive) continue;
        if (promo.startDate && now < new Date(promo.startDate)) continue;
        if (promo.endDate && now > new Date(promo.endDate)) continue;
        if (promo.maxUsage !== null && promo.usedCount >= promo.maxUsage) continue;
        validPromotions.push(promo);
      }

      // Apply fixed discounts first
      const fixedPromos = validPromotions.filter(p => p.discountType === "fixed");
      for (const p of fixedPromos) {
        const discount = Math.min(currentTotal, p.discountValue);
        calculatedDiscount += discount;
        currentTotal -= discount;
      }

      // Apply percent discounts next
      const percentPromos = validPromotions.filter(p => p.discountType === "percent");
      for (const p of percentPromos) {
        const discount = currentTotal * (p.discountValue / 100);
        calculatedDiscount += discount;
        currentTotal -= discount;
      }

      return {
        success: true,
        data: {
          originalPrice,
          discountAmount: calculatedDiscount,
          finalTotal: Math.max(0, originalPrice - calculatedDiscount),
          appliedPromotions: validPromotions
        }
      };
    } catch (error) {
      throw new Error(`Failed to calculate discount: ${error.message}`);
    }
  }

  async confirmUsage(promotionIds) {
    try {
      if (!promotionIds || promotionIds.length === 0) {
        return { success: true, message: "Không có mã giảm giá nào để cập nhật" };
      }

      const promos = await Promotion.find({ _id: { $in: promotionIds } });
      for (const p of promos) {
        p.usedCount += 1;
        if (p.maxUsage !== null && p.usedCount >= p.maxUsage) {
          p.isActive = false;
        }
        await p.save();
      }

      return {
        success: true,
        message: "Đã cập nhật lượt sử dụng mã giảm giá thành công!"
      };
    } catch (error) {
      throw new Error(`Failed to confirm usage: ${error.message}`);
    }
  }

  async revertUsage(promotionIds) {
    try {
      if (!promotionIds || promotionIds.length === 0) {
        return { success: true, message: "Không có mã giảm giá nào để hoàn lại" };
      }

      await Promotion.updateMany(
        { _id: { $in: promotionIds }, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } }
      );

      return {
        success: true,
        message: "Đã hoàn lại lượt sử dụng mã giảm giá thành công!"
      };
    } catch (error) {
      throw new Error(`Failed to revert usage: ${error.message}`);
    }
  }
}

module.exports = new PromotionService();
