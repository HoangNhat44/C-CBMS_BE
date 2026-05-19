const User = require("../../../models/users.model");

class UserService {
  // Lấy tất cả users
  async getAllUsers() {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      return {
        success: true,
        data: users,
      };
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  // Lấy user theo ID
  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }
      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Tạo user mới
  async createUser(userData) {
    try {
      const user = await User.create(userData);
      const createdUser = await User.findById(user._id);
      return {
        success: true,
        data: createdUser,
      };
    } catch (error) {
      if (error.code === 11000) {
        return {
          success: false,
          message: "Email already exists",
        };
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Cập nhật user
  async updateUser(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }
      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Xóa user
  async deleteUser(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }
      return {
        success: true,
        message: "User deleted successfully",
      };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}

module.exports = new UserService();
