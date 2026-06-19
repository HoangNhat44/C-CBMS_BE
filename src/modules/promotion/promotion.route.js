const express = require("express");
const promotionController = require("./promotion.controller");

const router = express.Router();

router.get("/", promotionController.getAllPromotions);
router.post("/apply", promotionController.applyPromotion);
router.post("/calculate", promotionController.calculateDiscount);
router.post("/confirm-usage", promotionController.confirmUsage);
router.post("/revert-usage", promotionController.revertUsage);
router.post("/", promotionController.createPromotion);
router.put("/:id", promotionController.updatePromotion);

module.exports = router;
