const express = require("express");
const bookingController = require("../controller/booking.controller");
const { authMiddleware, checkRoles, optionalAuthMiddleware } = require("../../../middlewares/auth.middleware");

const router = express.Router();

// Routes for booking module
router.get("/layout", bookingController.getBookingLayout);
router.get("/check-availability", bookingController.checkAvailability);
router.get("/", authMiddleware, checkRoles("customer", "staff", "owner"), bookingController.getAllBookings);
router.get("/:id", optionalAuthMiddleware, bookingController.getBookingById);
router.post("/", bookingController.createBooking); // open for guest/members
router.put("/:id/status", authMiddleware, bookingController.updateStatus);
router.delete("/:id", authMiddleware, bookingController.deleteBooking);

module.exports = router;
