const profileService = require("./profile.services");

class ProfileController {
  async getProfile(req, res) {
    try {
      const userId = req.user._id;
      const result = await profileService.getProfile(userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Get profile successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get profile",
        error: error.message,
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user._id;
      const result = await profileService.updateProfile(userId, req.body);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Update profile successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
      });
    }
  }
}

module.exports = new ProfileController();
