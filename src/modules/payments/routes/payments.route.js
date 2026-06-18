const express = require("express");
const paymentsController = require("../controller/payments.controller");
const { authMiddleware, checkRoles } = require("../../../middlewares/auth.middleware");

const router = express.Router();

// Public routes for PayOS redirects and webhook callbacks
router.get("/payos-return", paymentsController.payosReturn);
router.post("/payos-webhook", paymentsController.payosWebhook);
router.post("/create-url", paymentsController.createPaymentUrl);

// Protected routes (require JWT verification) - Temporarily disabled for testing
// router.use(authMiddleware);
router.post("/close-qr", paymentsController.closeQr);
router.get("/:id", paymentsController.findOne);

// Admin-only routes - Temporarily disabled for testing
router.post("/process", paymentsController.processPayment);
router.get("/", paymentsController.findAll);
router.delete("/:id", paymentsController.remove);

module.exports = router;
