const express = require("express");
const profileController = require("./profile.controller");
const { authMiddleware, requirePermission } = require("../../middlewares/auth.middleware");

const router = express.Router();

// Profile routes (protected by authMiddleware and requirePermission)
router.get("/", authMiddleware, requirePermission("VIEW_PROFILE"), profileController.getProfile);
router.put("/", authMiddleware, requirePermission("EDIT_PROFILE"), profileController.updateProfile);

module.exports = router;
