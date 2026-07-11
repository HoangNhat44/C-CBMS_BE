const Product = require("../../models/product.model");
const Category = require("../../models/category.model");

class ProductService {
  async createProduct(data) {
    try {
      const product = await Product.create(data);
      const populatedProduct = await Product.findById(product._id)
        .populate("categoryId")
        .populate("availableBranches");
      return { success: true, data: populatedProduct };
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async getAllProducts(filter = {}) {
    try {
      const products = await Product.find(filter)
        .populate("categoryId")
        .populate("availableBranches")
        .sort({ name: 1 });
      return { success: true, data: products };
    } catch (error) {
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }

  async getProductById(id) {
    try {
      const product = await Product.findById(id)
        .populate("categoryId")
        .populate("availableBranches");
      if (!product) {
        return { success: false, message: "Product not found" };
      }
      return { success: true, data: product };
    } catch (error) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  async updateProduct(id, data) {
    try {
      const product = await Product.findByIdAndUpdate(id, data, {
        returnDocument: 'after',
        runValidators: true,
      })
        .populate("categoryId")
        .populate("availableBranches");
      if (!product) {
        return { success: false, message: "Product not found" };
      }
      return { success: true, data: product };
    } catch (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  async deleteProduct(id) {
    try {
      const product = await Product.findByIdAndDelete(id);
      if (!product) {
        return { success: false, message: "Product not found" };
      }
      return { success: true, message: "Product deleted successfully" };
    } catch (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }
}

module.exports = new ProductService();
