const productService = require("./product.service");
const { verifyToken } = require("../../utils/jwt.util");
const User = require("../../models/users.model");

async function isStaffUser(req) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return false;
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).populate("roleId");
    if (!user || !user.isActive) return false;
    return ["admin", "owner", "staff"].includes(user.roleId.name);
  } catch (error) {
    return false;
  }
}

class ProductController {
  async createProduct(req, res) {
    try {
      const result = await productService.createProduct(req.body);
      res.status(201).json({
        message: "Create product successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to create product",
        error: error.message,
      });
    }
  }

  async getAllProducts(req, res) {
    try {
      const filter = {};
      if (req.query.categoryId) {
        filter.categoryId = req.query.categoryId;
      }
      if (req.query.branchId) {
        filter.availableBranches = req.query.branchId;
      }

      const isStaff = await isStaffUser(req);
      if (!isStaff) {
        filter.isActive = true;
      } else {
        if (req.query.isActive !== undefined) {
          filter.isActive = req.query.isActive === "true";
        }
      }

      const result = await productService.getAllProducts(filter);
      res.json({
        message: "Get products successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get products",
        error: error.message,
      });
    }
  }

  async getProductById(req, res) {
    try {
      const result = await productService.getProductById(req.params.id);
      if (!result.success) {
        return res.status(404).json(result);
      }
      res.json({
        message: "Get product successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get product",
        error: error.message,
      });
    }
  }

  async updateProduct(req, res) {
    try {
      const result = await productService.updateProduct(req.params.id, req.body);
      if (!result.success) {
        return res.status(404).json(result);
      }
      res.json({
        message: "Update product successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update product",
        error: error.message,
      });
    }
  }

  async deleteProduct(req, res) {
    try {
      const result = await productService.deleteProduct(req.params.id);
      if (!result.success) {
        return res.status(404).json(result);
      }
      res.json({
        message: "Delete product successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete product",
        error: error.message,
      });
    }
  }
}

module.exports = new ProductController();
