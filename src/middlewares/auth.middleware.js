const { verifyToken } = require("../utils/jwt.util");
const User = require("../models/users.model");

async function authMiddleware(req, res, next) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Token is missing."
      });
    }
    
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).populate({
      path: "roleId",
      populate: { path: "permissions" }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User not found or inactive."
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Invalid token.",
      error: error.message
    });
  }
}

function checkRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.roleId || !roles.includes(req.user.roleId.name)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Insufficient permissions."
      });
    }
    next();
  };
}

async function optionalAuthMiddleware(req, res, next) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return next();
    }
    
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).populate({
      path: "roleId",
      populate: { path: "permissions" }
    });
    
    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
}

function requirePermission(requiredCodes) {
  return (req, res, next) => {
    if (!req.user || !req.user.roleId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User or role not found."
      });
    }

    const permissions = req.user.roleId.permissions;
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. No permissions assigned."
      });
    }

    const codesToCheck = Array.isArray(requiredCodes) ? requiredCodes : [requiredCodes];
    const hasPermission = permissions.some(p => codesToCheck.includes(p.code));
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires one of permissions: ${codesToCheck.join(", ")}`
      });
    }

    next();
  };
}

module.exports = { authMiddleware, checkRoles, optionalAuthMiddleware, requirePermission };
