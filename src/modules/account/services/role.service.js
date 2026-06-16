const Role = require("../../../models/role.model");

class RoleService {
  async getAllRoles() {
    try {
      const roles = await Role.find({ isActive: true }).sort({ createdAt: -1 });
      return {
        success: true,
        data: roles,
      };
    } catch (error) {
      throw new Error(`Failed to get roles: ${error.message}`);
    }
  }
}

module.exports = new RoleService();
