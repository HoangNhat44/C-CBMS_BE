const express = require("express");
const permissionController = require("../controller/permission.controller");
const { authMiddleware, requirePermission } = require("../../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, requirePermission("VIEW_ROLE"), permissionController.getAllPermissions);

module.exports = router;
