const express = require("express");
const router = express.Router();
const roomPriceController = require("./roomPrice.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");

// Get matrix & history (Authenticated users)
router.get("/matrix", authMiddleware, roomPriceController.getMatrix);
router.get("/history", authMiddleware, roomPriceController.getHistory);

// Update matrix with automatic audit log creation
router.put("/matrix", authMiddleware, roomPriceController.updateMatrix);

module.exports = router;
