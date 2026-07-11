const Role = require("../../../models/role.model");
const Permission = require("../../../models/permission.model");

class RoleService {
  async getAllRoles() {
    try {
      const roles = await Role.find({ isActive: true })
        .populate("permissions")
        .sort({ createdAt: -1 });
      return {
        success: true,
        data: roles,
      };
    } catch (error) {
      throw new Error(`Failed to get roles: ${error.message}`);
    }
  }

  async updateRolePermissions(roleId, permissionCodes) {
    try {
      const permissions = await Permission.find({ code: { $in: permissionCodes } });
      const permissionIds = permissions.map(p => p._id);

      const updatedRole = await Role.findByIdAndUpdate(
        roleId,
        { permissions: permissionIds },
        { returnDocument: 'after' }
      ).populate("permissions");

      if (!updatedRole) {
        throw new Error("Role not found");
      }

      return {
        success: true,
        data: updatedRole,
      };
    } catch (error) {
      throw new Error(`Failed to update role permissions: ${error.message}`);
    }
  }
}

module.exports = new RoleService();
