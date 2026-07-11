const Permission = require("../../../models/permission.model");

class PermissionController {
  async getAllPermissions(req, res) {
    try {
      const permissions = await Permission.find();
      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get permissions",
        error: error.message,
      });
    }
  }
}

module.exports = new PermissionController();
