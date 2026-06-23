const Feedback = require("../../models/feedback.model");

// Ensure referenced schemas are registered in Mongoose for population hooks
require("../../models/users.model");
require("../../models/branch.model");
require("../../models/room.model");
require("../../models/booking.model");

class FeedbackService {
  async createFeedback(data) {
    try {
      const feedback = await Feedback.create(data);
      return { success: true, data: feedback };
    } catch (error) {
      throw new Error(`Failed to create feedback: ${error.message}`);
    }
  }

  async getAllFeedbacks(filter = {}, sortOption = { createdAt: -1 }) {
    try {
      const feedbacks = await Feedback.find(filter)
        .populate("customerId", "fullName email image")
        .populate("branchId", "name address")
        .populate("roomId", "roomName")
        .populate("bookingId")
        .sort(sortOption);
      return { success: true, data: feedbacks };
    } catch (error) {
      throw new Error(`Failed to get feedbacks: ${error.message}`);
    }
  }

  async getFeedbackById(id) {
    try {
      const feedback = await Feedback.findById(id)
        .populate("customerId", "fullName email image")
        .populate("branchId", "name address")
        .populate("roomId", "roomName")
        .populate("bookingId");
      if (!feedback) {
        return { success: false, message: "Feedback not found" };
      }
      return { success: true, data: feedback };
    } catch (error) {
      throw new Error(`Failed to get feedback: ${error.message}`);
    }
  }

  async updateFeedback(id, data) {
    try {
      const feedback = await Feedback.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
        .populate("customerId", "fullName email image")
        .populate("branchId", "name address")
        .populate("roomId", "roomName")
        .populate("bookingId");
      if (!feedback) {
        return { success: false, message: "Feedback not found" };
      }
      return { success: true, data: feedback };
    } catch (error) {
      throw new Error(`Failed to update feedback: ${error.message}`);
    }
  }

  async deleteFeedback(id) {
    try {
      const feedback = await Feedback.findByIdAndDelete(id);
      if (!feedback) {
        return { success: false, message: "Feedback not found" };
      }
      return { success: true, message: "Feedback deleted successfully" };
    } catch (error) {
      throw new Error(`Failed to delete feedback: ${error.message}`);
    }
  }
}

module.exports = new FeedbackService();
