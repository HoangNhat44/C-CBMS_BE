const express = require("express");
const slotController = require("./slot.controller");
const { authMiddleware, checkRoles } = require("../../middlewares/auth.middleware");

const router = express.Router();

// Routes
router.get("", slotController.getAllSlots);
router.get("/:id", slotController.getSlotById);
router.post("", authMiddleware, checkRoles("owner"), slotController.createSlot);
router.put("/:id", authMiddleware, checkRoles("owner"), slotController.updateSlot);
router.delete("/:id", authMiddleware, checkRoles("owner"), slotController.deleteSlot);

module.exports = router;
