const express = require("express");
const branchController = require("./branch.controller");
const { authMiddleware, checkRoles } = require("../../middlewares/auth.middleware");

const router = express.Router();

// Routes
router.get("", branchController.getAllBranches);
router.get("/:id", branchController.getBranchById);
router.post("", authMiddleware, checkRoles("owner"), branchController.createBranch);
router.put("/:id", authMiddleware, checkRoles("owner"), branchController.updateBranch);
router.delete("/:id", authMiddleware, checkRoles("owner"), branchController.deleteBranch);

module.exports = router;

