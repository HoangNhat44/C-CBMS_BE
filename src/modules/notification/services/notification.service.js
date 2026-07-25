const Notification = require("../../../models/notification.model");
const User = require("../../../models/users.model");
const Role = require("../../../models/role.model");

class NotificationService {
  async getNotifications(userId) {
    try {
      const list = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .lean();
      return { success: true, data: list };
    } catch (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }
  }

  async markAsRead(id, userId) {
    try {
      const notif = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true },
        { new: true }
      );
      if (!notif) {
        return { success: false, statusCode: 404, message: "Notification not found." };
      }
      return { success: true, data: notif };
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  async markAllAsRead(userId) {
    try {
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
      return { success: true, message: "Marked all notifications as read." };
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  // Create notification helper
  async createNotification({ userId, title, message, type, relatedId }, io) {
    try {
      const notif = await Notification.create({
        userId,
        title,
        message,
        type: type || "general",
        relatedId,
        isRead: false
      });

      // Emits real-time socket event to the specific user's room
      if (io) {
        io.to(userId.toString()).emit("new_notification", notif);
        console.log(`[Socket] Emitted new_notification to user room: ${userId}`);
      }

      return notif;
    } catch (error) {
      console.error("Failed to create notification record:", error);
      return null;
    }
  }

  // Send refund notification to all owners
  async notifyOwnersAboutRefund(booking, io) {
    try {
      // Find Owner Role
      const ownerRole = await Role.findOne({ name: { $regex: /owner/i } });
      if (!ownerRole) {
        console.error("Owner role not found in system.");
        return;
      }

      // Find all owners
      const owners = await User.find({ roleId: ownerRole._id });
      
      const bookingCode = booking.bookingCode || booking._id;
      const amount = booking.finalTotal ? booking.finalTotal.toLocaleString("vi-VN") + "đ" : "—";
      const title = "Yêu cầu hoàn tiền mới";
      const message = `Có yêu cầu hoàn tiền mới cho đơn đặt phòng #${bookingCode} (Số tiền: ${amount}).`;

      for (const owner of owners) {
        await this.createNotification({
          userId: owner._id,
          title,
          message,
          type: "refund_request",
          relatedId: booking._id
        }, io);
      }
    } catch (error) {
      console.error("Failed to notify owners about refund:", error);
    }
  }
}

module.exports = new NotificationService();
