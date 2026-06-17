const express = require("express");
const promotionController = require("./promotion.controller");

const router = express.Router();

router.get("/", promotionController.getAllPromotions);
router.post("/", promotionController.createPromotion);
router.put("/:id", promotionController.updatePromotion);

module.exports = router;
