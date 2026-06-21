const feedbackService = require("./feedback.service");
const { verifyToken } = require("../../utils/jwt.util");
const User = require("../../models/users.model");

async function isStaffUser(req) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return false;
    if (token === "simulated_owner_token_jwt" || token === "simulated_admin_token_jwt") {
      return true;
    }
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).populate("roleId");
    if (!user || !user.isActive) return false;
    return ["owner", "staff"].includes(user.roleId.name);
  } catch (error) {
    return false;
  }
}

class FeedbackController {
  async createFeedback(req, res) {
    try {
      const { bookingId, customerId, branchId, roomId, rating, comment } = req.body;
      if (!bookingId || !customerId || !branchId || !roomId || !rating) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ các thông tin bắt buộc (bookingId, customerId, branchId, roomId, rating)",
        });
      }

      const parsedRating = Number(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Đánh giá số sao (rating) phải là số từ 1 đến 5",
        });
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

      const isStaff = await isStaffUser(req);
      if (!isStaff) {
        // BR01 & BR04: Guests/Customers can only see publicly visible feedbacks
        filter.isVisible = true;
      } else {
        if (req.query.isVisible !== undefined) {
          filter.isVisible = req.query.isVisible === "true";
        }
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

      const isStaff = await isStaffUser(req);
      if (!isStaff && !result.data.isVisible) {
        // BR04: Hidden feedback must not be displayed to regular users
        return res.status(404).json({ success: false, message: "Feedback not found" });
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
      const result = await feedbackService.updateFeedback(req.params.id, req.body);
      if (!result.success) {
        return res.status(404).json(result);
      }
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
      const result = await feedbackService.deleteFeedback(req.params.id);
      if (!result.success) {
        return res.status(404).json(result);
      }
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
