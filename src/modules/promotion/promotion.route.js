const express = require("express");
const promotionController = require("./promotion.controller");
const { authMiddleware, optionalAuthMiddleware, requirePermission } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, promotionController.getAllPromotions);
router.post("/apply", authMiddleware, promotionController.applyPromotion);
router.post("/calculate", promotionController.calculateDiscount);
router.post("/confirm-usage", authMiddleware, promotionController.confirmUsage);
router.post("/revert-usage", authMiddleware, promotionController.revertUsage);
router.post("/", authMiddleware, requirePermission("CREATE_PROMOTION"), promotionController.createPromotion);
router.put("/:id", authMiddleware, requirePermission("CREATE_PROMOTION"), promotionController.updatePromotion);

module.exports = router;
