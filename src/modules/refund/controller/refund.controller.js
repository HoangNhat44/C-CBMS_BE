const refundService = require("../services/refund.service");
const Booking = require("../../../models/booking.model");

class RefundController {
  // Customer submits refund request
  async createRefund(req, res) {
    try {
      const { bookingId, reason } = req.body;
      const customerId = req.user._id;

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: "bookingId is required."
        });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Reason for refund is required."
        });
      }

      const result = await refundService.createRefundRequest({
        bookingId,
        customerId,
        reason
      });

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }

      return res.status(result.statusCode).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create refund request.",
        error: error.message
      });
    }
  }

  // Owner gets all refund requests
  async getAllRefunds(req, res) {
    try {
      const result = await refundService.getRefunds();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch refund requests.",
        error: error.message
      });
    }
  }

  // Get refund details by booking ID
  async getRefundByBookingId(req, res) {
    try {
      const { bookingId } = req.params;
      const result = await refundService.getRefundByBookingId(bookingId);
      if (!result.success) {
        return res.status(result.statusCode).json(result);
      }

      const refund = result.data;
      const booking = await Booking.findById(refund.bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Associated booking not found."
        });
      }

      // Permission-based Access Control
      if (req.user) {
        const hasViewAll = req.user.roleId?.permissions?.some(p => p.code === "VIEW_REFUND_REQUEST");
        const isStaff = !!req.user.branchId;

        if (!hasViewAll) {
          if (isStaff) {
            if (booking.branchId.toString() !== req.user.branchId.toString()) {
              return res.status(403).json({
                success: false,
                message: "Forbidden. Staff can only view refunds belonging to their own branch."
              });
            }
          } else {
            // Customer
            if (booking.customerId.toString() !== req.user._id.toString()) {
              return res.status(403).json({
                success: false,
                message: "Forbidden. You are not allowed to view this refund details."
              });
            }
          }
        }
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch refund details.",
        error: error.message
      });
    }
  }

  // Owner approves a refund request
  async approveRefund(req, res) {
    try {
      const { id } = req.params;
      const { proofImage, adminNotes } = req.body;

      if (!proofImage) {
        return res.status(400).json({
          success: false,
          message: "Transaction proof image is required to approve the refund."
        });
      }

      const result = await refundService.approveRefund(id, {
        proofImage,
        adminNotes
      });

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to approve refund request.",
        error: error.message
      });
    }
  }

  // Customer cancels their pending refund request
  async cancelRefundRequest(req, res) {
    try {
      const { bookingId } = req.params;
      const customerId = req.user._id;

      const result = await refundService.cancelRefundRequest(bookingId, customerId);
      if (!result.success) {
        return res.status(result.statusCode).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to cancel refund request.",
        error: error.message
      });
    }
  }
}

module.exports = new RefundController();
