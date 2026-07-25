const Refund = require("../../../models/refund.model");
const Booking = require("../../../models/booking.model");
const Payment = require("../../../models/payment.model");
const bookingService = require("../../booking/services/booking.service");
const { EmailService } = require("../../../config/email.service");
const notificationService = require("../../notification/services/notification.service");

class RefundService {
  // Create refund request or execute same-day cancellation
  async createRefundRequest({ bookingId, customerId, reason, io }) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return { success: false, statusCode: 404, message: "Booking not found." };
      }

      // Check ownership
      const bookingCustomerId = booking.customerId ? booking.customerId.toString() : null;
      if (bookingCustomerId !== customerId.toString()) {
        return { success: false, statusCode: 403, message: "Forbidden. This booking does not belong to you." };
      }

      // Validate status
      if (booking.status !== "confirmed") {
        return { success: false, statusCode: 400, message: "Only confirmed bookings can request a refund/cancellation." };
      }

      if (booking.paymentStatus !== "paid") {
        return { success: false, statusCode: 400, message: "Booking is not paid, cannot request refund." };
      }

      // Compare dates to identify same-day cancellation
      const bookingDateObj = new Date(booking.bookingDate);
      bookingDateObj.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isSameDay = bookingDateObj.getTime() <= today.getTime();

      if (isSameDay) {
        // Same-day: Direct cancel / refunded status, amount 0
        const updatedBooking = await bookingService.updateStatus(bookingId, {
          status: "refunded",
          paymentStatus: "refunded"
        });

        // Resolve associated payment if any
        const payment = await Payment.findOne({ bookingId, status: "success" });
        if (payment) {
          payment.status = "refunded";
          await payment.save();
        }

        const refund = await Refund.create({
          bookingId,
          paymentId: payment ? payment._id : undefined,
          customerId,
          amount: 0,
          reason: reason || "Hủy đặt phòng trong ngày (Không hoàn tiền)",
          status: "refunded",
          adminNotes: "Hủy trong ngày, không được hoàn tiền theo quy định.",
          processedAt: new Date()
        });

        // Notify owners about refund
        await notificationService.notifyOwnersAboutRefund(booking, io);

        return {
          success: true,
          statusCode: 200,
          isSameDay: true,
          message: "Hủy đơn đặt phòng thành công. Đơn hàng bị hủy trong ngày nên không được hoàn trả tiền.",
          data: { booking: updatedBooking.data, refund }
        };
      } else {
        // Advance: Creates pending refund request
        const payment = await Payment.findOne({ bookingId, status: "success" });
        
        const refund = await Refund.create({
          bookingId,
          paymentId: payment ? payment._id : undefined,
          customerId,
          amount: booking.finalTotal,
          reason,
          status: "pending"
        });

        const updatedBooking = await bookingService.updateStatus(bookingId, {
          status: "request_refund"
        });

        // Notify owners about refund
        await notificationService.notifyOwnersAboutRefund(booking, io);

        return {
          success: true,
          statusCode: 201,
          isSameDay: false,
          message: "Gửi yêu cầu hoàn tiền thành công.",
          data: { booking: updatedBooking.data, refund }
        };
      }
    } catch (error) {
      throw new Error(`Failed to process refund request: ${error.message}`);
    }
  }

  // Get all refund requests (for Owner)
  async getRefunds() {
    try {
      const refunds = await Refund.find({})
        .populate("bookingId")
        .populate("customerId", "fullName email phone")
        .populate("paymentId")
        .sort({ createdAt: -1 });

      return { success: true, data: refunds };
    } catch (error) {
      throw new Error(`Failed to fetch refunds: ${error.message}`);
    }
  }

  // Get refund details by booking ID
  async getRefundByBookingId(bookingId) {
    try {
      const refund = await Refund.findOne({ bookingId })
        .populate("customerId", "fullName email phone")
        .populate("paymentId");

      if (!refund) {
        return { success: false, statusCode: 404, message: "No refund request found for this booking." };
      }

      return { success: true, data: refund };
    } catch (error) {
      throw new Error(`Failed to fetch refund by booking ID: ${error.message}`);
    }
  }

  // Approve a pending refund (for Owner)
  async approveRefund(refundId, { proofImage, adminNotes }) {
    try {
      const refund = await Refund.findById(refundId);
      if (!refund) {
        return { success: false, statusCode: 404, message: "Refund request not found." };
      }

      if (refund.status !== "pending") {
        return { success: false, statusCode: 400, message: "Only pending refund requests can be approved." };
      }

      // Update refund request
      refund.status = "refunded";
      refund.proofImage = proofImage || "";
      refund.adminNotes = adminNotes || "";
      refund.processedAt = new Date();
      await refund.save();

      // Update Booking
      const updatedBooking = await bookingService.updateStatus(refund.bookingId, {
        status: "refunded",
        paymentStatus: "refunded"
      });

      // Update associated Payment
      if (refund.paymentId) {
        await Payment.findByIdAndUpdate(refund.paymentId, { status: "refunded" });
      }

      // Send refund success email to customer
      if (updatedBooking.success && updatedBooking.data && updatedBooking.data.customerId?.email) {
        const bookingData = updatedBooking.data;
        EmailService.sendRefundSuccessEmail({
          to: bookingData.customerId.email,
          fullName: bookingData.customerId.fullName || "Quý khách",
          refund,
          booking: bookingData
        }).catch((err) => {
          console.error("[Email Error] Failed to send refund success email:", err);
        });
      }

      return {
        success: true,
        statusCode: 200,
        message: "Xác nhận hoàn tiền thành công.",
        data: { refund, booking: updatedBooking.data }
      };
    } catch (error) {
      throw new Error(`Failed to approve refund: ${error.message}`);
    }
  }

  // Customer cancels their pending refund request
  async cancelRefundRequest(bookingId, customerId) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return { success: false, statusCode: 404, message: "Booking not found." };
      }

      if (booking.customerId?.toString() !== customerId.toString()) {
        return { success: false, statusCode: 403, message: "Forbidden. This booking does not belong to you." };
      }

      if (booking.status !== "request_refund") {
        return { success: false, statusCode: 400, message: "Booking is not in refund request state." };
      }

      const refund = await Refund.findOne({ bookingId, status: "pending" });
      if (!refund) {
        return { success: false, statusCode: 404, message: "No pending refund request found to cancel." };
      }

      // Mark refund as cancelled
      refund.status = "cancelled";
      refund.adminNotes = "Khách hàng đã tự hủy yêu cầu hoàn tiền.";
      refund.processedAt = new Date();
      await refund.save();

      // Restore booking status back to confirmed
      const updatedBooking = await bookingService.updateStatus(bookingId, {
        status: "confirmed"
      });

      return {
        success: true,
        statusCode: 200,
        message: "Rút lại yêu cầu hoàn tiền thành công. Đơn phòng đã được khôi phục về trạng thái Đã xác nhận.",
        data: { booking: updatedBooking.data, refund }
      };
    } catch (error) {
      throw new Error(`Failed to cancel refund request: ${error.message}`);
    }
  }
}

module.exports = new RefundService();
