const express = require("express");
const paymentsController = require("../controller/payments.controller");
const { authMiddleware, requirePermission, optionalAuthMiddleware } = require("../../../middlewares/auth.middleware");

const router = express.Router();

// Public routes for PayOS redirects and webhook callbacks
router.get("/payos-return", paymentsController.payosReturn);
router.post("/payos-webhook", paymentsController.payosWebhook);
router.post("/create-url", optionalAuthMiddleware, paymentsController.createPaymentUrl);

// Protected routes (require JWT verification)
router.post("/close-qr", authMiddleware, paymentsController.closeQr);
router.get("/:id", authMiddleware, paymentsController.findOne);

// Admin/Owner routes
router.post("/process", authMiddleware, requirePermission(["PAY_ORDER", "UPDATE_BOOKING"]), paymentsController.processPayment);
router.get("/", authMiddleware, requirePermission("VIEW_REVENUE"), paymentsController.findAll);
router.delete("/:id", authMiddleware, requirePermission("UPDATE_ACCOUNT"), paymentsController.remove);

module.exports = router;
