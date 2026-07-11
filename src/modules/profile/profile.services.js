const User = require("../../models/users.model");

class ProfileService {
  async getProfile(userId) {
    try {
      const user = await User.findById(userId)
        .populate("roleId", "name")
        .populate("branchId", "name address phone");
      
      if (!user) {
        return {
          success: false,
          message: "User profile not found",
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw new Error(`Failed to get profile: ${error.message}`);
    }
  }

  async updateProfile(userId, updateData) {
    try {
      // Whitelist only fullName and phone fields for profile updates
      const allowedUpdates = {};
      if (updateData.hasOwnProperty("fullName")) allowedUpdates.fullName = updateData.fullName;
      if (updateData.hasOwnProperty("phone")) allowedUpdates.phone = updateData.phone;

      // Update the user
      const user = await User.findByIdAndUpdate(userId, allowedUpdates, {
        returnDocument: 'after',
        runValidators: true,
      })
        .populate("roleId", "name")
        .populate("branchId", "name address phone");

      if (!user) {
        return {
          success: false,
          message: "User profile not found",
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }
}

module.exports = new ProfileService();
