const userService = require("../services/user.service");

class UserController {
  // Lấy tất cả users
  async getAllUsers(req, res) {
    try {
      const result = await userService.getAllUsers();
      res.json({
        message: "Get users successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get users",
        error: error.message,
      });
    }
  }

  // Lấy user theo ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.getUserById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Get user successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get user",
        error: error.message,
      });
    }
  }

  // Tạo user mới
  async createUser(req, res) {
    try {
      const result = await userService.createUser(req.body);

      if (!result.success) {
        return res.status(409).json({
          message: result.message,
          ...result,
        });
      }

      res.status(201).json({
        message: "Create user successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to create user",
        error: error.message,
      });
    }
  }

  // Cập nhật user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.updateUser(id, req.body);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Update user successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update user",
        error: error.message,
      });
    }
  }

  // Xóa user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Delete user successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete user",
        error: error.message,
      });
    }
  }
}

module.exports = new UserController();
