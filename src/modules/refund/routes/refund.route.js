const express = require("express");
const refundController = require("../controller/refund.controller");
const { authMiddleware, requirePermission, optionalAuthMiddleware } = require("../../../middlewares/auth.middleware");

const router = express.Router();

// Shared endpoints (Customer, Staff, Owner) - Allow optional authentication for guests
router.get("/booking/:bookingId", optionalAuthMiddleware, refundController.getRefundByBookingId);

// Apply auth check globally on other refund routes
router.use(authMiddleware);

// Customer endpoints
router.post("/", requirePermission("SEND_REFUND_REQUEST"), refundController.createRefund);
router.post("/cancel/:bookingId", requirePermission("SEND_REFUND_REQUEST"), refundController.cancelRefundRequest);

// Owner endpoints
router.get("/", requirePermission("VIEW_REFUND_REQUEST"), refundController.getAllRefunds);
router.put("/:id/approve", requirePermission("UPDATE_REFUND_REQUEST"), refundController.approveRefund);

module.exports = router;
