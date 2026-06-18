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
    const user = await User.findById(decoded.userId).populate("roleId");
    
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

module.exports = { authMiddleware, checkRoles };
