const crypto = require("crypto");

const User = require("../../../models/users.model");
const Role = require("../../../models/role.model");
const { EmailService } = require("./email.service")
const { hashPassword, comparePassword, validatePasswordStrength } = require("../../../utils/password.util");
const { signToken, verifyToken } = require("../../../utils/jwt.util");

const RESET_TOKEN_EXPIRES_MINUTES = 15;
const DEFAULT_REGISTER_ROLE = "customer";

function formatUserResponse(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    roleId: user.roleId,
    role: user.roleId?.name ? { id: user.roleId._id, name: user.roleId.name, description: user.roleId.description } : undefined,
    branchId: user.branchId,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

class AuthService {
  async register({ firstName, lastName, email, phone, password }) {
    if (!firstName?.trim() || !lastName?.trim()) {
      return { success: false, statusCode: 400, message: "First name and last name are required." };
    }

    if (!email?.trim()) {
      return { success: false, statusCode: 400, message: "Email is required." };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, statusCode: 400, message: "Invalid email format." };
    }

    if (!phone?.trim()) {
      return { success: false, statusCode: 400, message: "Phone number is required." };
    }

    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(phone.trim())) {
      return { success: false, statusCode: 400, message: "Invalid phone number format. Please enter a valid 10-digit Vietnamese phone number starting with 0." };
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return {
        success: false,
        statusCode: 400,
        message: passwordCheck.errors[0],
        errors: passwordCheck.errors,
      };
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return { success: false, statusCode: 409, message: "Email already exists." };
    }

    const role = await Role.findOne({ name: DEFAULT_REGISTER_ROLE, isActive: true });
    if (!role) {
      return {
        success: false,
        statusCode: 500,
        message: `Default role "${DEFAULT_REGISTER_ROLE}" not found. Please run seed.`,
      };
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone?.trim() || "",
      roleId: role._id,
      isActive: true,
    });

    const populatedUser = await User.findById(user._id).populate("roleId");

    try {
      await EmailService.sendRegistrationEmail({
        to: populatedUser.email,
        fullName: populatedUser.fullName,
        isActive: populatedUser.isActive,
        roleName: role.description || role.name,
      });
    } catch (emailError) {
      console.error("[Auth] Registration email failed:", emailError.message);
    }

    return {
      success: true,
      statusCode: 201,
      message: "Account created! Please wait for admin approval before signing in.",
      data: formatUserResponse(populatedUser),
    };
  }

  async login({ email, password, remember = false }) {
    if (!email?.trim() || !password) {
      return { success: false, statusCode: 400, message: "Email and password are required." };
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail })
      .select("+password")
      .populate("roleId");

    if (!user) {
      return { success: false, statusCode: 401, message: "Invalid email or password." };
    }

    if (!user.isActive) {
      return {
        success: false,
        statusCode: 403,
        message: "Your account is pending approval. Please check your email for updates.",
      };
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return { success: false, statusCode: 401, message: "Invalid email or password." };
    }

    const token = signToken(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.roleId?.name,
      },
      remember
    );

    return {
      success: true,
      statusCode: 200,
      message: "Login successful.",
      data: {
        token,
        user: formatUserResponse(user),
      },
    };
  }

  async forgotPassword({ email }) {
    if (!email?.trim()) {
      return { success: false, statusCode: 400, message: "Email is required." };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const genericMessage =
      "If an account with that email exists, a password reset link has been sent.";

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.isActive) {
      return { success: true, statusCode: 200, message: genericMessage };
    }

    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    try {
      await EmailService.sendPasswordResetRequestEmail({
        to: user.email,
        fullName: user.fullName,
        token: resetToken,
        expiresMinutes: RESET_TOKEN_EXPIRES_MINUTES,
      });
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("[Auth] Password reset email failed:", emailError.message);
      return {
        success: false,
        statusCode: 500,
        message: "Could not send reset link. Try again.",
      };
    }

    return { success: true, statusCode: 200, message: genericMessage };
  }

  async resetPassword({ token, password }) {
    if (!token?.trim()) {
      return { success: false, statusCode: 400, message: "Reset token is required." };
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return {
        success: false,
        statusCode: 400,
        message: passwordCheck.errors[0],
        errors: passwordCheck.errors,
      };
    }

    if (passwordCheck.score < 2) {
      return {
        success: false,
        statusCode: 400,
        message: "Choose a stronger password before continuing.",
      };
    }

    const hashedToken = hashResetToken(token.trim());

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return {
        success: false,
        statusCode: 400,
        message: "Reset failed. The link may have expired.",
      };
    }

    user.password = await hashPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    try {
      await EmailService.sendPasswordResetSuccessEmail({
        to: user.email,
        fullName: user.fullName,
      });
    } catch (emailError) {
      console.error("[Auth] Password reset success email failed:", emailError.message);
    }

    return {
      success: true,
      statusCode: 200,
      message: "Password updated successfully! You can now sign in with your new credentials.",
    };
  }

  async changePassword({ userId, currentPassword, newPassword }) {
    if (!userId || !currentPassword || !newPassword) {
      return { success: false, statusCode: 400, message: "Missing required fields." };
    }

    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return {
        success: false,
        statusCode: 400,
        message: passwordCheck.errors[0],
        errors: passwordCheck.errors,
      };
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return { success: false, statusCode: 404, message: "User not found." };
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return { success: false, statusCode: 401, message: "Mật khẩu hiện tại không đúng." };
    }

    user.password = await hashPassword(newPassword);
    await user.save({ validateBeforeSave: false });

    return {
      success: true,
      statusCode: 200,
      message: "Đổi mật khẩu thành công.",
    };
  }

  async verifyAuthToken(token) {
    if (!token) {
      return { success: false, statusCode: 401, message: "No token provided." };
    }

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).populate("roleId");

      if (!user || !user.isActive) {
        return { success: false, statusCode: 401, message: "Invalid or inactive account." };
      }

      return {
        success: true,
        statusCode: 200,
        message: "Token is valid.",
        data: {
          user: formatUserResponse(user),
          decoded,
        },
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 401,
        message: error.name === "TokenExpiredError" ? "Token expired." : "Invalid token.",
      };
    }
  }
}

module.exports = new AuthService();
