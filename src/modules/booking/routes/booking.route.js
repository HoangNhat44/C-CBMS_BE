const express = require("express");
const bookingController = require("../controller/booking.controller");

const router = express.Router();

// Routes for booking module
router.get("/layout", bookingController.getBookingLayout);
router.get("/check-availability", bookingController.checkAvailability);
router.get("/", bookingController.getAllBookings);
router.get("/:id", bookingController.getBookingById);
router.post("/", bookingController.createBooking);
router.put("/:id/status", bookingController.updateStatus);
router.delete("/:id", bookingController.deleteBooking);

module.exports = router;
