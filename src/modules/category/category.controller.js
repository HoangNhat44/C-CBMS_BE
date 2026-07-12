const categoryService = require("./category.service");
const { verifyToken } = require("../../utils/jwt.util");
const User = require("../../models/users.model");

async function isStaffUser(req) {
  try {
    if (req.user) {
      if (!req.user.isActive) return false;
      const permissions = req.user.roleId?.permissions || [];
      return permissions.some(p => 
        ["CREATE_PRODUCT", "UPDATE_PRODUCT", "DELETE_PRODUCT", "VIEW_REVENUE"].includes(p.code || p)
      );
    }

    // Fallback/Simulated token check for development
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return false;
    if (token === "simulated_owner_token_jwt" || token === "simulated_admin_token_jwt" || token === "simulated_staff_token_jwt") {
      return true;
    }
    
    // Parse normal token if not parsed by middleware
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).populate({
      path: "roleId",
      populate: { path: "permissions" }
    });
    if (!user || !user.isActive) return false;
    const permissions = user.roleId?.permissions || [];
    return permissions.some(p => 
      ["CREATE_PRODUCT", "UPDATE_PRODUCT", "DELETE_PRODUCT", "VIEW_REVENUE"].includes(p.code || p)
    );
  } catch (error) {
    return false;
  }
}

class CategoryController {
  async createCategory(req, res) {
    try {
      const isStaff = await isStaffUser(req);
      if (!isStaff) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền thực hiện hành động này." });
      }
      const result = await categoryService.createCategory(req.body);
      res.status(201).json({
        message: "Create category successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to create category",
        error: error.message,
      });
    }
  }

  async getAllCategories(req, res) {
    try {
      const filter = {};
      const isStaff = await isStaffUser(req);
      if (!isStaff) {
        filter.isActive = true;
      } else {
        if (req.query.isActive !== undefined) {
          filter.isActive = req.query.isActive === "true";
        }
      }

      const result = await categoryService.getAllCategories(filter);
      res.json({
        message: "Get categories successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get categories",
        error: error.message,
      });
    }
  }

  async getCategoryById(req, res) {
    try {
      const result = await categoryService.getCategoryById(req.params.id);
      if (!result.success) {
        return res.status(404).json(result);
      }

      const isStaff = await isStaffUser(req);
      if (!isStaff && !result.data.isActive) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }

      res.json({
        message: "Get category successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get category",
        error: error.message,
      });
    }
  }

  async updateCategory(req, res) {
    try {
      const isStaff = await isStaffUser(req);
      if (!isStaff) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền thực hiện hành động này." });
      }
      const result = await categoryService.updateCategory(req.params.id, req.body);
      if (!result.success) {
        return res.status(404).json(result);
      }
      res.json({
        message: "Update category successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update category",
        error: error.message,
      });
    }
  }

  async deleteCategory(req, res) {
    try {
      const isStaff = await isStaffUser(req);
      if (!isStaff) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền thực hiện hành động này." });
      }
      const result = await categoryService.deleteCategory(req.params.id);
      if (!result.success) {
        return res.status(404).json(result);
      }
      res.json({
        message: "Delete category successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete category",
        error: error.message,
      });
    }
  }
}

module.exports = new CategoryController();
