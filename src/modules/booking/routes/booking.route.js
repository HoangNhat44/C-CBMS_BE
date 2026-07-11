const express = require("express");
const bookingController = require("../controller/booking.controller");
const { authMiddleware, optionalAuthMiddleware, requirePermission } = require("../../../middlewares/auth.middleware");

const router = express.Router();

// Routes for booking module
router.get("/layout", optionalAuthMiddleware, bookingController.getBookingLayout);
router.get("/check-availability", optionalAuthMiddleware, bookingController.checkAvailability);
router.get("/", authMiddleware, requirePermission(["VIEW_BOOKING_HISTORY", "VIEW_BOOKING_SCHEDULE"]), bookingController.getAllBookings);
router.get("/:id", optionalAuthMiddleware, bookingController.getBookingById);
router.post("/", optionalAuthMiddleware, bookingController.createBooking); // open for guest/members
router.put("/:id/status", authMiddleware, requirePermission("UPDATE_BOOKING"), bookingController.updateStatus);
router.delete("/:id", authMiddleware, requirePermission(["CANCEL_BOOKING", "UPDATE_BOOKING"]), bookingController.deleteBooking);

module.exports = router;
