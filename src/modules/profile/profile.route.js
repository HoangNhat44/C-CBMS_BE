const express = require("express");
const profileController = require("./profile.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");

const router = express.Router();

// Profile routes (protected by authMiddleware)
router.get("/", authMiddleware, profileController.getProfile);
router.put("/", authMiddleware, profileController.updateProfile);

module.exports = router;
