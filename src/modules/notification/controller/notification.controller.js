const notificationService = require("../services/notification.service");

class NotificationController {
  async getNotifications(req, res) {
    try {
      const userId = req.user._id;
      const result = await notificationService.getNotifications(userId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const result = await notificationService.markAsRead(id, userId);
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user._id;
      const result = await notificationService.markAllAsRead(userId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new NotificationController();
