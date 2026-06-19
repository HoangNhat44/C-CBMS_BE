const bookingService = require("../services/booking.service");

class BookingController {
  // Get booking layout for a branch and date
  async getBookingLayout(req, res) {
    try {
      const { branchId, date } = req.query;

      if (!branchId || !date) {
        return res.status(400).json({
          success: false,
          message: "branchId and date (YYYY-MM-DD) are required query parameters."
        });
      }

      const result = await bookingService.getBookingLayout(branchId, date);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to get booking layout",
        error: error.message
      });
    }
  }

  // Check if room is available
  async checkAvailability(req, res) {
    try {
      const { roomId, bookingDate, slotId } = req.query;

      if (!roomId || !bookingDate || !slotId) {
        return res.status(400).json({
          success: false,
          message: "roomId, bookingDate, and slotId are required queries."
        });
      }

      const result = await bookingService.checkAvailability(roomId, bookingDate, slotId);
      
      return res.status(200).json({
        success: true,
        message: result.available ? "Room is available" : "Room is unavailable",
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to check room availability",
        error: error.message
      });
    }
  }

  // Get all bookings with query filters
  async getAllBookings(req, res) {
    try {
      const roleName = req.user.roleId?.name;

      const filters = {
        roomId: req.query.roomId,
        bookingDate: req.query.bookingDate,
        status: req.query.status,
        paymentStatus: req.query.paymentStatus
      };

      // Apply RBAC filters based on role
      if (roleName === "customer") {
        filters.customerId = req.user._id;
      } else if (roleName === "staff") {
        filters.branchId = req.user.branchId;
      } else if (roleName === "owner") {
        if (req.query.customerId) filters.customerId = req.query.customerId;
        if (req.query.branchId) filters.branchId = req.query.branchId;
      } else {
        return res.status(403).json({
          success: false,
          message: "Forbidden. Insufficient permissions."
        });
      }

      const result = await bookingService.getAllBookings(filters);

      return res.status(200).json({
        success: true,
        message: "Get bookings successfully",
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to get bookings",
        error: error.message
      });
    }
  }

  // Get booking details by ID
  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      const result = await bookingService.getBookingById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      const booking = result.data;
      const roleName = req.user.roleId?.name;

      // Access control check for detailed view
      if (roleName === "customer") {
        const bookingCustomerId = booking.customerId ? (booking.customerId._id ? booking.customerId._id.toString() : booking.customerId.toString()) : null;
        if (bookingCustomerId !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Forbidden. You are not allowed to view this booking."
          });
        }
      } else if (roleName === "staff") {
        const bookingBranchId = booking.branchId ? (booking.branchId._id ? booking.branchId._id.toString() : booking.branchId.toString()) : null;
        const staffBranchId = req.user.branchId ? req.user.branchId.toString() : null;
        if (bookingBranchId !== staffBranchId) {
          return res.status(403).json({
            success: false,
            message: "Forbidden. You are not allowed to view bookings from other branches."
          });
        }
      } else if (roleName !== "owner") {
        return res.status(403).json({
          success: false,
          message: "Forbidden. Insufficient permissions."
        });
      }

      return res.status(200).json({
        success: true,
        message: "Get booking successfully",
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to get booking details",
        error: error.message
      });
    }
  }

  // Create booking
  async createBooking(req, res) {
    try {
      const result = await bookingService.createBooking(req.body);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }

      // Emit real-time socket event
      const io = req.app.get("io");
      if (io && result.data) {
        io.emit("booking:created", {
          branchId: result.data.branchId._id || result.data.branchId,
          roomId: result.data.roomId._id || result.data.roomId,
          slotId: result.data.slotId._id || result.data.slotId,
          bookingDate: result.data.bookingDate
        });
      }

      return res.status(result.statusCode).json({
        success: true,
        message: "Create booking successfully",
        data: result.data
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create booking",
        error: error.message
      });
    }
  }

  // Update booking status or payment status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, paymentStatus } = req.body;

      if (!status && !paymentStatus) {
        return res.status(400).json({
          success: false,
          message: "Either status or paymentStatus is required to update."
        });
      }

      const result = await bookingService.updateStatus(id, { status, paymentStatus });

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }

      // Emit real-time socket event
      const io = req.app.get("io");
      if (io && result.data) {
        io.emit("booking:updated", {
          branchId: result.data.branchId._id || result.data.branchId,
          roomId: result.data.roomId._id || result.data.roomId,
          slotId: result.data.slotId._id || result.data.slotId,
          bookingDate: result.data.bookingDate,
          status: result.data.status
        });
      }

      return res.status(result.statusCode).json({
        success: true,
        message: "Update booking status successfully",
        data: result.data
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update booking status",
        error: error.message
      });
    }
  }

  // Delete booking record from DB
  async deleteBooking(req, res) {
    try {
      const { id } = req.params;
      const result = await bookingService.deleteBooking(id);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }

      return res.status(result.statusCode).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete booking",
        error: error.message
      });
    }
  }
}

module.exports = new BookingController();
