const User = require("../../../models/users.model");
const { EmailService } = require("../../../config/email.service");

class UserService {
  // Lấy tất cả users
  async getAllUsers() {
    try {
      const users = await User.find().populate("roleId", "name").sort({ createdAt: -1 });
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
      const user = await User.findById(userId).populate("roleId", "name");
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
      if (!userData.email) {
        return { success: false, statusCode: 400, message: "Email is required." };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email.trim())) {
        return { success: false, statusCode: 400, message: "Invalid email format." };
      }
      userData.email = userData.email.trim().toLowerCase();

      if (!userData.phone || !userData.phone.trim()) {
        return { success: false, statusCode: 400, message: "Phone number is required." };
      }
      const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
      if (!phoneRegex.test(userData.phone.trim())) {
        return { success: false, statusCode: 400, message: "Invalid phone number format. Please enter a valid 10-digit Vietnamese phone number starting with 0." };
      }
      userData.phone = userData.phone.trim();

      if (!userData.password) {
        return { success: false, statusCode: 400, message: "Password is required." };
      }
      const { hashPassword, validatePasswordStrength } = require("../../../utils/password.util");
      const passwordCheck = validatePasswordStrength(userData.password);
      if (!passwordCheck.valid) {
        return {
          success: false,
          statusCode: 400,
          message: passwordCheck.errors[0],
          errors: passwordCheck.errors,
        };
      }
      userData.password = await hashPassword(userData.password);

      const user = await User.create(userData);
      const createdUser = await User.findById(user._id).populate("roleId", "name");
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
      if (updateData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email.trim())) {
          return { success: false, statusCode: 400, message: "Invalid email format." };
        }
        updateData.email = updateData.email.trim().toLowerCase();
      }

      if (updateData.phone !== undefined) {
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        if (updateData.phone && !phoneRegex.test(updateData.phone.trim())) {
          return { success: false, statusCode: 400, message: "Invalid phone number format. Please enter a valid 10-digit Vietnamese phone number starting with 0." };
        }
        if (updateData.phone) updateData.phone = updateData.phone.trim();
      }

      if (updateData.password) {
        const { hashPassword, validatePasswordStrength } = require("../../../utils/password.util");
        const passwordCheck = validatePasswordStrength(updateData.password);
        if (!passwordCheck.valid) {
          return {
            success: false,
            statusCode: 400,
            message: passwordCheck.errors[0],
            errors: passwordCheck.errors,
          };
        }
        updateData.password = await hashPassword(updateData.password);
      }

      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const wasInactive = !existingUser.isActive;
      const willActivate = updateData.isActive === true;

      const user = await User.findByIdAndUpdate(userId, updateData, {
        returnDocument: 'after',
        runValidators: true,
      });

      if (wasInactive && willActivate) {
        try {
          await EmailService.sendRegistrationEmail({
            to: user.email,
            fullName: user.fullName,
            isActive: true,
          });
        } catch (emailError) {
          console.error("[User] Activation email failed:", emailError.message);
        }
      }

      const populatedUser = await User.findById(user._id).populate("roleId", "name");

      return {
        success: true,
        data: populatedUser,
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
