const express = require("express");
const roleController = require("../controller/role.controller");
const { authMiddleware, requirePermission } = require("../../../middlewares/auth.middleware");

const router = express.Router();

// Routes
router.get("/", authMiddleware, requirePermission("VIEW_ROLE"), roleController.getAllRoles);
router.put("/:id/permissions", authMiddleware, requirePermission("UPDATE_ROLE"), roleController.updateRolePermissions);

module.exports = router;
