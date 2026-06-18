const paymentsService = require("../services/payments.service");

class PaymentsController {
  async createPaymentUrl(req, res) {
    try {
      const { booking_id, payment_type } = req.body;
      if (!booking_id) {
        return res.status(400).json({
          success: false,
          message: "booking_id is required"
        });
      }

      const result = await paymentsService.createPaymentUrl(booking_id, payment_type || "full");
      return res.status(200).json({
        success: true,
        message: "Payment link created successfully",
        url: result.checkoutUrl,
        checkoutUrl: result.checkoutUrl,
        qrCode: result.qrCode,
        orderCode: result.orderCode,
        paymentLinkId: result.paymentLinkId,
        amount: result.amount,
        status: result.status,
        payment: result.payment
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create payment url",
        error: error.message
      });
    }
  }

  async payosReturn(req, res) {
    try {
      const io = req.app.get("io");
      const result = await paymentsService.handlePayosReturn(req.query, io);

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const status = result.success ? "success" : "fail";
      const message = encodeURIComponent(result.message);

      if (result.bookingId) {
        res.redirect(`${frontendUrl}?paymentStatus=${status}&bookingId=${result.bookingId}&message=${message}`);
      } else {
        res.redirect(`${frontendUrl}?paymentStatus=${status}&message=${message}`);
      }
    } catch (error) {
      console.error("Error in payosReturn:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}?paymentStatus=fail&message=${encodeURIComponent(error.message)}`);
    }
  }

  async payosWebhook(req, res) {
    try {
      console.log("Received PayOS webhook request. Body:", JSON.stringify(req.body, null, 2));
      const io = req.app.get("io");
      await paymentsService.handlePayosWebhook(req.body, io);
      return res.status(200).json({
        error: 0,
        message: "Ok",
        data: null
      });
    } catch (error) {
      console.error("PayOS webhook verification failed:", error);
      return res.status(400).json({
        error: 1,
        message: error.message,
        data: null
      });
    }
  }

  async closeQr(req, res) {
    try {
      const { payment_id, payment_link_id, order_code } = req.body;
      const result = await paymentsService.removeTemporaryPayment({
        paymentId: payment_id,
        paymentLinkId: payment_link_id,
        orderCode: order_code
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to close payment link",
        error: error.message
      });
    }
  }

  async processPayment(req, res) {
    try {
      const { booking_id, amount_paid } = req.body;
      if (!booking_id || amount_paid === undefined) {
        return res.status(400).json({
          success: false,
          message: "booking_id and amount_paid are required"
        });
      }

      const io = req.app.get("io");
      const result = await paymentsService.processPayment(booking_id, amount_paid, io);
      return res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to process payment manually",
        error: error.message
      });
    }
  }

  async findAll(req, res) {
    try {
      const result = await paymentsService.findAll();
      return res.status(200).json({
        success: true,
        message: "Get all payments successfully",
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch payments list",
        error: error.message
      });
    }
  }

  async findOne(req, res) {
    try {
      const io = req.app.get("io");
      const result = await paymentsService.findOne(req.params.id, io);
      return res.status(200).json({
        success: true,
        message: "Get payment details successfully",
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch payment details",
        error: error.message
      });
    }
  }

  async remove(req, res) {
    try {
      const result = await paymentsService.remove(req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete payment transaction",
        error: error.message
      });
    }
  }
}

module.exports = new PaymentsController();
