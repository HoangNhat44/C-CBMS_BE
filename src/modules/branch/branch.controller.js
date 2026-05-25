const branchService = require("./branch.services");

class BranchController {
  async getAllBranches(req, res) {
    try {
      const result = await branchService.getAllBranches();

      res.json({
        message: "Get branches successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get branches",
        error: error.message,
      });
    }
  }

  async getBranchById(req, res) {
    try {
      const { id } = req.params;
      const result = await branchService.getBranchById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Get branch successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get branch",
        error: error.message,
      });
    }
  }

  async createBranch(req, res) {
    try {
      const result = await branchService.createBranch(req.body);

      res.status(201).json({
        message: "Create branch successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to create branch",
        error: error.message,
      });
    }
  }

  async updateBranch(req, res) {
    try {
      const { id } = req.params;
      const result = await branchService.updateBranch(id, req.body);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Update branch successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update branch",
        error: error.message,
      });
    }
  }

  async deleteBranch(req, res) {
    try {
      const { id } = req.params;
      const result = await branchService.deleteBranch(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Delete branch successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete branch",
        error: error.message,
      });
    }
  }
}

module.exports = new BranchController();
