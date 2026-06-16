const express = require("express");
const authController = require("../controller/auth.controller");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/verify", authController.verifyToken);
router.put("/change-password", authController.changePassword);

module.exports = router;
