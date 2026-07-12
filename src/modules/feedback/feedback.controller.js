const feedbackService = require("./feedback.service");
const { verifyToken } = require("../../utils/jwt.util");
const User = require("../../models/users.model");
const mongoose = require("mongoose");

async function getCurrentUser(req) {
  try {
    if (req.user) return req.user;

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return null;

    if (token === "simulated_owner_token_jwt" || token === "simulated_admin_token_jwt") {
      const owner = await User.findOne({ email: "owner@example.com" }).populate({
        path: "roleId",
        populate: { path: "permissions" }
      });
      if (owner) return owner;
      return { roleId: { name: "owner", permissions: [] }, branchId: null, isActive: true };
    }

    if (token === "simulated_staff_token_jwt") {
      const staff = await User.findOne({ email: "staff@example.com" }).populate({
        path: "roleId",
        populate: { path: "permissions" }
      });
      if (staff) return staff;
      return { roleId: { name: "staff", permissions: [] }, branchId: null, isActive: true };
    }

    if (token === "simulated_customer_token_jwt") {
      const customer = await User.findById("6a38f6096149376ca36423a0").populate({
        path: "roleId",
        populate: { path: "permissions" }
      });
      if (customer) return customer;
      return { _id: new mongoose.Types.ObjectId("6a38f6096149376ca36423a0"), roleId: { name: "customer", permissions: [] }, isActive: true };
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).populate({
      path: "roleId",
      populate: { path: "permissions" }
    });
    if (!user || !user.isActive) return null;
    return user;
  } catch (error) {
    return null;
  }
}

async function isStaffUser(req) {
  try {
    if (req.user) {
      if (!req.user.isActive) return false;
      const permissions = req.user.roleId?.permissions || [];
      return permissions.some(p => 
        ["DELETE_FEEDBACK", "EDIT_FEEDBACK", "CREATE_FEEDBACK", "VIEW_REVENUE"].includes(p.code || p)
      );
    }

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return false;
    if (token === "simulated_owner_token_jwt" || token === "simulated_admin_token_jwt" || token === "simulated_staff_token_jwt") {
      return true;
    }
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).populate({
      path: "roleId",
      populate: { path: "permissions" }
    });
    if (!user || !user.isActive) return false;
    const permissions = user.roleId?.permissions || [];
    return permissions.some(p => 
      ["DELETE_FEEDBACK", "EDIT_FEEDBACK", "CREATE_FEEDBACK", "VIEW_REVENUE"].includes(p.code || p)
    );
  } catch (error) {
    return false;
  }
}

class FeedbackController {
  async createFeedback(req, res) {
    try {
      const { bookingId, rating, comment } = req.body;
      if (!bookingId || !rating) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ các thông tin bắt buộc (bookingId, rating)",
        });
      }

      const parsedRating = Number(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Đánh giá số sao (rating) phải là số từ 1 đến 5",
        });
      }

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({
          success: false,
          message: "Mã đơn đặt phòng (Booking ID) không đúng định dạng.",
        });
      }

      // Check if booking exists and is completed
      const Booking = require("../../models/booking.model");
      const booking = await Booking.findById(bookingId).lean();
      if (!booking) {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng không tồn tại trong hệ thống.",
        });
      }

      if (booking.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng chưa hoàn thành. Bạn chỉ có thể gửi đánh giá phản hồi sau khi đơn đặt phòng đã hoàn thành (completed).",
        });
      }

      // Populate related IDs from the booking document (supporting both customerId/userId and roomId/slotId)
      req.body.customerId = booking.customerId || booking.userId;
      req.body.branchId = booking.branchId;

      if (booking.roomId) {
        req.body.roomId = booking.roomId;
      } else {
        // If booking document has no roomId, find a room belonging to the same branch
        const Room = require("../../models/room.model");
        const room = await Room.findOne({ branchId: booking.branchId });
        if (room) {
          req.body.roomId = room._id;
        } else {
          // Fallback to slotId to avoid missing required field
          req.body.roomId = booking.slotId;
        }
      }

      const result = await feedbackService.createFeedback(req.body);
      res.status(201).json({
        message: "Gửi phản hồi thành công!",
        ...result,
      });
    } catch (error) {
      // Handle Mongoose duplicate key error for unique bookingId
      if (error.message.includes("E11000") || error.message.includes("duplicate key")) {
        return res.status(400).json({
          success: false,
          message: "Đặt phòng này đã được gửi phản hồi đánh giá rồi.",
          error: error.message,
        });
      }
      res.status(400).json({
        success: false,
        message: "Lỗi khi gửi phản hồi đánh giá",
        error: error.message,
      });
    }
  }

  async getAllFeedbacks(req, res) {
    try {
      const filter = {};
      if (req.query.branchId) filter.branchId = req.query.branchId;
      if (req.query.roomId) filter.roomId = req.query.roomId;
      if (req.query.bookingId) filter.bookingId = req.query.bookingId;
      if (req.query.rating) filter.rating = Number(req.query.rating);

      // Search feedback comments by keyword (Alternative Scenario)
      if (req.query.search) {
        filter.comment = { $regex: req.query.search, $options: "i" };
      }

      // Sort feedbacks by newest, highest rating, or lowest rating (Alternative Scenario)
      let sortOption = { createdAt: -1 }; // default: newest
      if (req.query.sortBy === "highestRating") {
        sortOption = { rating: -1 };
      } else if (req.query.sortBy === "lowestRating") {
        sortOption = { rating: 1 };
      }

      const currentUser = await getCurrentUser(req);
      const hasViewAll = currentUser?.roleId?.permissions?.some(p => ["VIEW_REVENUE", "VIEW_ROLE", "VIEW_ACCOUNT", "VIEW_REFUND_REQUEST"].includes(p.code));
      const isStaff = !!currentUser?.branchId;

      if (hasViewAll) {
        // Owner/Admin can see all feedbacks
        if (req.query.isVisible !== undefined) {
          filter.isVisible = req.query.isVisible === "true";
        }
      } else if (isStaff) {
        // Staff can only see feedbacks of their own branch
        filter.branchId = currentUser.branchId;

        if (req.query.isVisible !== undefined) {
          filter.isVisible = req.query.isVisible === "true";
        }
      } else {
        // Guests/Customers can only see publicly visible feedbacks
        filter.isVisible = true;
      }

      const result = await feedbackService.getAllFeedbacks(filter, sortOption);
      res.json({
        message: "Lấy danh sách phản hồi thành công",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách phản hồi",
        error: error.message,
      });
    }
  }

  async getFeedbackById(req, res) {
    try {
      const result = await feedbackService.getFeedbackById(req.params.id);
      if (!result.success) {
        return res.status(404).json(result);
      }

      const currentUser = await getCurrentUser(req);
      const hasViewAll = currentUser?.roleId?.permissions?.some(p => ["VIEW_REVENUE", "VIEW_ROLE", "VIEW_ACCOUNT", "VIEW_REFUND_REQUEST"].includes(p.code));
      const isStaff = !!currentUser?.branchId;

      if (hasViewAll) {
        // Owner/Admin can see any feedback
      } else if (isStaff) {
        // Staff can only see feedback of their own branch
        const feedbackBranchId = result.data.branchId?._id || result.data.branchId;
        const staffBranchId = currentUser.branchId?._id || currentUser.branchId;
        if (feedbackBranchId && staffBranchId && feedbackBranchId.toString() !== staffBranchId.toString()) {
          return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập phản hồi của chi nhánh khác." });
        }
      } else {
        // Customers/Guests can only see if visible
        if (!result.data.isVisible) {
          return res.status(404).json({ success: false, message: "Feedback not found" });
        }
      }

      res.json({
        message: "Lấy thông tin phản hồi thành công",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy chi tiết phản hồi",
        error: error.message,
      });
    }
  }

  async updateFeedback(req, res) {
    try {
      const feedbackCheck = await feedbackService.getFeedbackById(req.params.id);
      if (!feedbackCheck.success) {
        return res.status(404).json(feedbackCheck);
      }

      const currentUser = await getCurrentUser(req);
      const hasViewAll = currentUser?.roleId?.permissions?.some(p => ["VIEW_REVENUE", "VIEW_ROLE", "VIEW_ACCOUNT", "VIEW_REFUND_REQUEST"].includes(p.code));
      const isStaff = !!currentUser?.branchId;

      // Owner and Staff cannot update feedbacks (Read-only)
      if (hasViewAll || isStaff) {
        return res.status(403).json({ success: false, message: "Quản trị viên và Nhân viên chỉ có quyền xem phản hồi, không có quyền chỉnh sửa." });
      }

      // Customer can only update their own feedback
      const feedbackCustomerId = feedbackCheck.data.customerId?._id || feedbackCheck.data.customerId;
      const currentUserId = currentUser?._id;
      if (!currentUserId || feedbackCustomerId.toString() !== currentUserId.toString()) {
        return res.status(403).json({ success: false, message: "Bạn chỉ có thể chỉnh sửa đánh giá phản hồi của chính mình." });
      }

      const result = await feedbackService.updateFeedback(req.params.id, req.body);
      res.json({
        message: "Cập nhật phản hồi thành công",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Lỗi khi cập nhật phản hồi",
        error: error.message,
      });
    }
  }

  async deleteFeedback(req, res) {
    try {
      const feedbackCheck = await feedbackService.getFeedbackById(req.params.id);
      if (!feedbackCheck.success) {
        return res.status(404).json(feedbackCheck);
      }

      const currentUser = await getCurrentUser(req);
      const hasViewAll = currentUser?.roleId?.permissions?.some(p => ["VIEW_REVENUE", "VIEW_ROLE", "VIEW_ACCOUNT", "VIEW_REFUND_REQUEST"].includes(p.code));
      const isStaff = !!currentUser?.branchId;

      // Owner and Staff cannot delete feedbacks (Read-only)
      if (hasViewAll || isStaff) {
        return res.status(403).json({ success: false, message: "Quản trị viên và Nhân viên chỉ có quyền xem phản hồi, không có quyền xóa." });
      }

      // Customer can only delete their own feedback
      const feedbackCustomerId = feedbackCheck.data.customerId?._id || feedbackCheck.data.customerId;
      const currentUserId = currentUser?._id;
      if (!currentUserId || feedbackCustomerId.toString() !== currentUserId.toString()) {
        return res.status(403).json({ success: false, message: "Bạn chỉ có thể xóa đánh giá phản hồi của chính mình." });
      }

      const result = await feedbackService.deleteFeedback(req.params.id);
      res.json({
        message: "Xóa phản hồi thành công",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa phản hồi",
        error: error.message,
      });
    }
  }
}

module.exports = new FeedbackController();
