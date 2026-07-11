const express = require("express");
const slotController = require("./slot.controller");
const { authMiddleware, optionalAuthMiddleware, requirePermission } = require("../../middlewares/auth.middleware");

const router = express.Router();

// Routes
router.get("", optionalAuthMiddleware, slotController.getAllSlots);
router.get("/:id", optionalAuthMiddleware, slotController.getSlotById);
router.post("", authMiddleware, requirePermission("CREATE_SLOT"), slotController.createSlot);
router.put("/:id", authMiddleware, requirePermission("UPDATE_SLOT"), slotController.updateSlot);
router.patch("/:id/status", authMiddleware, requirePermission("UPDATE_SLOT_STATUS"), slotController.updateSlotStatus);

module.exports = router;
