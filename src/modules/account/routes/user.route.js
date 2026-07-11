const express = require("express");
const userController = require("../controller/user.controller");
const { authMiddleware, requirePermission } = require("../../../middlewares/auth.middleware");

const router = express.Router();

// Routes
router.get("/", authMiddleware, requirePermission("VIEW_ACCOUNT"), userController.getAllUsers);
router.get("/:id", authMiddleware, requirePermission("VIEW_ACCOUNT"), userController.getUserById);
router.post("/", authMiddleware, requirePermission("CREATE_ACCOUNT"), userController.createUser);
router.put("/:id", authMiddleware, requirePermission("UPDATE_ACCOUNT"), userController.updateUser);
router.delete("/:id", authMiddleware, requirePermission("UPDATE_ACCOUNT_STATUS"), userController.deleteUser);

module.exports = router;
