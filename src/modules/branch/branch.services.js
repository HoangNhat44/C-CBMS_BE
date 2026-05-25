const Branch = require("../../models/branch.model");

class BranchService {
  async getAllBranches() {
    try {
      const branches = await Branch.find().sort({ createdAt: -1 });

      return {
        success: true,
        data: branches,
      };
    } catch (error) {
      throw new Error(`Failed to get branches: ${error.message}`);
    }
  }

  async getBranchById(branchId) {
    try {
      const branch = await Branch.findById(branchId);

      if (!branch) {
        return {
          success: false,
          message: "Branch not found",
        };
      }

      return {
        success: true,
        data: branch,
      };
    } catch (error) {
      throw new Error(`Failed to get branch: ${error.message}`);
    }
  }

  async createBranch(branchData) {
    try {
      const branch = await Branch.create(branchData);

      return {
        success: true,
        data: branch,
      };
    } catch (error) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  async updateBranch(branchId, updateData) {
    try {
      const branch = await Branch.findByIdAndUpdate(branchId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!branch) {
        return {
          success: false,
          message: "Branch not found",
        };
      }

      return {
        success: true,
        data: branch,
      };
    } catch (error) {
      throw new Error(`Failed to update branch: ${error.message}`);
    }
  }

  async deleteBranch(branchId) {
    try {
      const branch = await Branch.findByIdAndDelete(branchId);

      if (!branch) {
        return {
          success: false,
          message: "Branch not found",
        };
      }

      return {
        success: true,
        data: branch,
      };
    } catch (error) {
      throw new Error(`Failed to delete branch: ${error.message}`);
    }
  }
}

module.exports = new BranchService();
