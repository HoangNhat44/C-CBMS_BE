const express = require("express");
const branchController = require("./branch.controller");
const { authMiddleware, requirePermission } = require("../../middlewares/auth.middleware");

const router = express.Router();

// Routes
router.get("", branchController.getAllBranches);
router.get("/:id", branchController.getBranchById);
router.post("", authMiddleware, requirePermission("CREATE_BRANCH"), branchController.createBranch);
router.put("/:id", authMiddleware, requirePermission("UPDATE_BRANCH"), branchController.updateBranch);
router.delete("/:id", authMiddleware, requirePermission("DELETE_BRANCH"), branchController.deleteBranch);

module.exports = router;

