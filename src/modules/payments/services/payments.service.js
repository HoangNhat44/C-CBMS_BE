const Payment = require("../../../models/payment.model");
const Booking = require("../../../models/booking.model");
const User = require("../../../models/users.model");
const { EmailService } = require("../../authenticaiton/services/email.service");
const { PayOS } = require("@payos/node");

class PaymentsService {
  getPayosInstance() {
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
      throw new Error("Missing PayOS configuration in environment variables");
    }

    return new PayOS({ clientId, apiKey, checksumKey });
  }

  async resolvePaymentAmount(booking, paymentType) {
    const existingPayments = await Payment.find({
      bookingId: booking._id,
      status: "success"
    });

    const totalPaid = existingPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const remainingAmount = booking.finalTotal - totalPaid;

    if (paymentType === "deposit") {
      return Math.max(0, Math.min(Math.round(booking.finalTotal * 0.5), remainingAmount));
    }
    return Math.max(0, Math.round(remainingAmount));
  }

  generateOrderCode() {
    return Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000);
  }

  async createPaymentUrl(bookingId, paymentType = "full") {
    const payOS = this.getPayosInstance();

    const booking = await Booking.findById(bookingId).populate("customerId");
    if (!booking) {
      throw new Error(`Booking #${bookingId} not found`);
    }

    if (["completed", "cancelled"].includes(booking.status)) {
      throw new Error("Cannot create payment link for a completed or cancelled booking");
    }

    const amount = await this.resolvePaymentAmount(booking, paymentType);
    if (amount <= 0) {
      throw new Error("Booking is already fully paid");
    }

    const orderCode = this.generateOrderCode();
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const description = `CBMS booking ${booking._id.toString().slice(-6)}`;
    const returnUrl = `${backendUrl}/api/payments/payos-return`;
    const cancelUrl = `${backendUrl}/api/payments/payos-return`;
    const expiredAt = Math.floor(Date.now() / 1000) + 15 * 60; // 15 mins expiration

    const payload = {
      orderCode,
      amount,
      description,
      buyerName: booking.customerId?.fullName || "Guest",
      buyerEmail: booking.customerId?.email || "guest@example.com",
      buyerPhone: booking.customerId?.phone || "0900000000",
      items: [
        {
          name: `Booking Room`,
          quantity: 1,
          price: amount
        }
      ],
      returnUrl,
      cancelUrl,
      expiredAt,
    };

    const responseData = await payOS.paymentRequests.create(payload);

    // Remove any previous pending payments to keep db clean
    await Payment.deleteMany({
      bookingId: booking._id,
      status: { $in: ["pending", "processing"] }
    });

    const payment = await Payment.create({
      bookingId: booking._id,
      customerId: booking.customerId._id,
      amount,
      amountPaid: 0,
      method: "payos",
      paymentType,
      status: "pending",
      orderCode,
      paymentLinkId: responseData.paymentLinkId,
      checkoutUrl: responseData.checkoutUrl,
      qrCode: responseData.qrCode,
      description,
      expiredAt: new Date(expiredAt * 1000),
      rawResponse: responseData
    });

    return {
      payment,
      orderCode,
      paymentLinkId: responseData.paymentLinkId,
      checkoutUrl: responseData.checkoutUrl,
      qrCode: responseData.qrCode,
      status: responseData.status,
      amount,
      expiredAt
    };
  }

  async handlePayosReturn(query, io) {
    const { orderCode, id: paymentLinkId } = query;
    const payment = await Payment.findOne({
      $or: [{ orderCode }, { paymentLinkId }]
    }).populate("bookingId customerId");

    if (!payment) {
      return { success: false, message: "Transaction not found" };
    }

    if (payment.status === "success") {
      return { success: true, bookingId: payment.bookingId?._id, message: "Payment successful" };
    }

    const syncResult = await this.syncPayosStatus(payment, io);
    return {
      success: syncResult.status === "success",
      bookingId: payment.bookingId?._id,
      message: syncResult.status === "success" ? "Payment successful" : "Payment pending/failed"
    };
  }

  async handlePayosWebhook(body, io) {
    const payOS = this.getPayosInstance();
    const webhookData = await payOS.webhooks.verify(body);

    const orderCode = webhookData.orderCode;
    const paymentLinkId = webhookData.paymentLinkId;

    const payment = await Payment.findOne({
      $or: [{ orderCode }, { paymentLinkId }]
    }).populate("bookingId customerId");

    if (!payment) {
      return { message: "Transaction not found" };
    }

    if (payment.status === "success") {
      return { success: true, message: "Payment already processed" };
    }

    const paidAmount = Number(webhookData.amount || webhookData.amountPaid || payment.amount);
    const code = String(webhookData.code || "").toUpperCase();
    const desc = String(webhookData.desc || "").toUpperCase();

    payment.rawWebhook = body;

    if (code === "00" || desc === "SUCCESS") {
      await this.markPaymentPaid(payment, paidAmount, io);
      return { success: true, message: "Payment marked paid" };
    }

    if (desc.includes("EXPIRED") || desc.includes("FAILED")) {
      payment.status = "failed";
      await payment.save();
      return { success: true, message: "Payment failed/expired" };
    }

    await payment.save();
    return { success: true };
  }

  async syncPayosStatus(payment, io) {
    const payOS = this.getPayosInstance();
    const payosId = payment.orderCode || payment.paymentLinkId;

    if (!payosId) return payment;

    try {
      const data = await payOS.paymentRequests.get(payosId);
      const status = String(data?.status || "").toUpperCase();

      payment.rawResponse = data;

      if (status === "PAID") {
        const paidAmount = Number(data?.amountPaid || data?.amount || payment.amount);
        return await this.markPaymentPaid(payment, paidAmount, io);
      }

      if (status === "CANCELLED") {
        payment.status = "cancelled";
        await payment.save();
      } else if (status === "EXPIRED") {
        payment.status = "expired";
        await payment.save();
      }

      return payment;
    } catch (err) {
      console.error("Failed to sync status with PayOS:", err);
      return payment;
    }
  }

  async markPaymentPaid(payment, amountPaid, io) {
    payment.amountPaid = amountPaid;
    payment.status = "success";
    payment.paidAt = new Date();
    await payment.save();

    const booking = await Booking.findById(payment.bookingId).populate("customerId");
    if (booking) {
      const existingSuccess = await Payment.find({
        bookingId: booking._id,
        status: "success"
      });
      const totalPaid = existingSuccess.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

      booking.status = "confirmed";

      if (totalPaid >= booking.finalTotal) {
        booking.paymentStatus = "paid";
      }

      await booking.save();

      if (booking.customerId?.email) {
        EmailService.sendPaymentSuccessEmail({
          to: booking.customerId.email,
          fullName: booking.customerId.fullName,
          booking,
          payment
        }).catch((err) => {
          console.error("Error sending success mail:", err);
        });
      }

      if (io) {
        io.emit("booking:updated", {
          branchId: booking.branchId,
          roomId: booking.roomId,
          slotId: booking.slotId,
          bookingDate: booking.bookingDate,
          status: booking.status
        });
      }
    }

    return payment;
  }

  async processPayment(bookingId, amountPaid, io) {
    const booking = await Booking.findById(bookingId).populate("customerId");
    if (!booking) {
      throw new Error(`Booking #${bookingId} not found`);
    }

    let payment = await Payment.findOne({
      bookingId: booking._id,
      status: "pending"
    });

    if (!payment) {
      payment = new Payment({
        bookingId: booking._id,
        customerId: booking.customerId?._id,
        amount: amountPaid,
        method: "cash",
        status: "pending"
      });
    }

    payment.method = "cash";
    await this.markPaymentPaid(payment, amountPaid, io);

    return { success: true, payment };
  }

  async findAll() {
    return await Payment.find().populate("bookingId customerId").sort({ createdAt: -1 });
  }

  async findOne(id, io) {
    const payment = await Payment.findById(id).populate("bookingId customerId");
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.method === "payos" && ["pending", "processing"].includes(payment.status)) {
      return await this.syncPayosStatus(payment, io);
    }

    return payment;
  }

  async remove(id) {
    const result = await Payment.findByIdAndDelete(id);
    if (!result) {
      throw new Error("Payment not found");
    }
    return { success: true, message: "Payment transaction deleted" };
  }

  async removeTemporaryPayment(params) {
    const { paymentId, paymentLinkId, orderCode } = params;
    const query = {};
    if (paymentId) query._id = paymentId;
    if (paymentLinkId) query.paymentLinkId = paymentLinkId;
    if (orderCode) query.orderCode = orderCode;

    const payment = await Payment.findOne(query);
    if (!payment) {
      return { success: false, message: "Temporary payment not found" };
    }

    if (!["pending", "processing"].includes(payment.status)) {
      throw new Error("Only pending/unpaid payments can be closed");
    }

    await Payment.findByIdAndDelete(payment._id);
    return { success: true, message: "Temporary payment transaction cancelled" };
  }
}

module.exports = new PaymentsService();
