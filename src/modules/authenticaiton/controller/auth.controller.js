const authService = require("../services/auth.service");

class AuthController {
  async register(req, res) {
    try {
      const { firstName, lastName, email, phone, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match.",
        });
      }

      const result = await authService.register({
        firstName,
        lastName,
        email,
        phone,
        password,
      });

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        ...(result.errors && { errors: result.errors }),
        ...(result.data && { data: result.data }),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Registration failed. Try again.",
        error: error.message,
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password, remember } = req.body;
      const result = await authService.login({ email, password, remember });

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        ...(result.data && { data: result.data }),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Login failed. Check your credentials.",
        error: error.message,
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword({ email });

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Could not send reset link. Try again.",
        error: error.message,
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match.",
        });
      }

      const result = await authService.resetPassword({ token, password });

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        ...(result.errors && { errors: result.errors }),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Reset failed. The link may have expired.",
        error: error.message,
      });
    }
  }

  async verifyToken(req, res) {
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const result = await authService.verifyAuthToken(token);

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        ...(result.data && { data: result.data }),
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
