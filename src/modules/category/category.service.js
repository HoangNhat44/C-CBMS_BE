const Category = require("../../models/category.model");

class CategoryService {
  async createCategory(data) {
    try {
      const category = await Category.create(data);
      return { success: true, data: category };
    } catch (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }
  }

  async getAllCategories(filter = {}) {
    try {
      const categories = await Category.find(filter).sort({ name: 1 });
      return { success: true, data: categories };
    } catch (error) {
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }

  async getCategoryById(id) {
    try {
      const category = await Category.findById(id);
      if (!category) {
        return { success: false, message: "Category not found" };
      }
      return { success: true, data: category };
    } catch (error) {
      throw new Error(`Failed to get category: ${error.message}`);
    }
  }

  async updateCategory(id, data) {
    try {
      const category = await Category.findByIdAndUpdate(id, data, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!category) {
        return { success: false, message: "Category not found" };
      }
      return { success: true, data: category };
    } catch (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
  }

  async deleteCategory(id) {
    try {
      const category = await Category.findByIdAndDelete(id);
      if (!category) {
        return { success: false, message: "Category not found" };
      }
      return { success: true, message: "Category deleted successfully" };
    } catch (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }
}

module.exports = new CategoryService();
