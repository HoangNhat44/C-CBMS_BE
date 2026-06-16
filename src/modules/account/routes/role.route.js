const express = require("express");
const roleController = require("../controller/role.controller");

const router = express.Router();

// Routes
router.get("/", roleController.getAllRoles);

module.exports = router;
