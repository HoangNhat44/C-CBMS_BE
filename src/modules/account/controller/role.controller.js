const roleService = require("../services/role.service");

class RoleController {
  // Lấy tất cả roles
  async getAllRoles(req, res) {
    try {
      const result = await roleService.getAllRoles();
      res.json({
        message: "Get roles successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get roles",
        error: error.message,
      });
    }
  }
  async updateRolePermissions(req, res) {
    try {
      const { id } = req.params;
      const { permissionCodes } = req.body;
      const result = await roleService.updateRolePermissions(id, permissionCodes);
      res.json({
        message: "Update role permissions successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update role permissions",
        error: error.message,
      });
    }
  }
}

module.exports = new RoleController();
