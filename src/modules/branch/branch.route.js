const express = require("express");
const branchController = require("./branch.controller");

const router = express.Router();

// Routes
router.get("", branchController.getAllBranches);
router.get("/:id", branchController.getBranchById);
router.post("", branchController.createBranch);
router.put("/:id", branchController.updateBranch);
router.delete("/:id", branchController.deleteBranch);

module.exports = router;
