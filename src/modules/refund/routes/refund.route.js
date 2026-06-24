const express = require("express");
const refundController = require("../controller/refund.controller");
const { authMiddleware, checkRoles, optionalAuthMiddleware } = require("../../../middlewares/auth.middleware");

const router = express.Router();

// Shared endpoints (Customer, Staff, Owner) - Allow optional authentication for guests
router.get("/booking/:bookingId", optionalAuthMiddleware, refundController.getRefundByBookingId);

// Apply auth check globally on other refund routes
router.use(authMiddleware);

// Customer endpoints
router.post("/", checkRoles("customer"), refundController.createRefund);

// Owner endpoints
router.get("/", checkRoles("owner"), refundController.getAllRefunds);
router.put("/:id/approve", checkRoles("owner"), refundController.approveRefund);

module.exports = router;
