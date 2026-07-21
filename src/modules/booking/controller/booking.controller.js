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
      const hasViewAll = req.user.roleId?.permissions?.some(p => ["VIEW_REVENUE", "VIEW_ROLE", "VIEW_ACCOUNT", "VIEW_REFUND_REQUEST"].includes(p.code));
      const isStaff = !!req.user.branchId;

      const filters = {
        roomId: req.query.roomId,
        bookingDate: req.query.bookingDate,
        status: req.query.status,
        paymentStatus: req.query.paymentStatus
      };

      // Apply Permission-based filters
      if (hasViewAll) {
        if (req.query.customerId) filters.customerId = req.query.customerId;
        if (req.query.branchId) filters.branchId = req.query.branchId;
      } else if (isStaff) {
        filters.branchId = req.user.branchId;
      } else {
        // Customer
        filters.customerId = req.user._id;
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
      // Access control check for detailed view
      if (req.user) {
        const hasViewAll = req.user.roleId?.permissions?.some(p => ["VIEW_REVENUE", "VIEW_ROLE", "VIEW_ACCOUNT", "VIEW_REFUND_REQUEST"].includes(p.code));
        const isStaff = !!req.user.branchId;

        if (!hasViewAll) {
          if (isStaff) {
            const bookingBranchId = booking.branchId ? (booking.branchId._id ? booking.branchId._id.toString() : booking.branchId.toString()) : null;
            const staffBranchId = req.user.branchId ? req.user.branchId.toString() : null;
            if (bookingBranchId !== staffBranchId) {
              return res.status(403).json({
                success: false,
                message: "Forbidden. You are not allowed to view bookings from other branches."
              });
            }
          } else {
            // Customer
            const bookingCustomerId = booking.customerId ? (booking.customerId._id ? booking.customerId._id.toString() : booking.customerId.toString()) : null;
            if (bookingCustomerId !== req.user._id.toString()) {
              return res.status(403).json({
                success: false,
                message: "Forbidden. You are not allowed to view this booking."
              });
            }
          }
        }
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
      // Enforce permission if user is logged in
      if (req.user) {
        const permissions = req.user.roleId?.permissions || [];
        const hasPermission = permissions.some(p => p.code === "CREATE_BOOKING");
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: "Forbidden. You do not have permission to create a booking."
          });
        }
      }

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

      // Fetch the booking details first
      const getResult = await bookingService.getBookingById(id);
      if (!getResult.success) {
        return res.status(404).json(getResult);
      }

      const booking = getResult.data;
      const userId = req.user._id.toString();
      const userBranchId = req.user.branchId ? req.user.branchId.toString() : null;

      const hasFullAccess = req.user.roleId?.permissions?.some(p => ["VIEW_REVENUE", "VIEW_ROLE", "VIEW_ACCOUNT", "VIEW_REFUND_REQUEST"].includes(p.code));
      const isStaff = !!req.user.branchId;

      // Access Control and Business Logic Validation based on Permission/Branch
      if (!hasFullAccess) {
        if (isStaff) {
          // Staff must belong to the same branch
          const bookingBranchId = booking.branchId ? (booking.branchId._id ? booking.branchId._id.toString() : booking.branchId.toString()) : null;
          if (bookingBranchId !== userBranchId) {
            return res.status(403).json({
              success: false,
              message: "Forbidden. Staff can only update bookings for their own branch."
            });
          }

          // Staff status transition validation
          if (status) {
            if (status === "completed") {
              if (booking.status !== "confirmed") {
                return res.status(400).json({
                  success: false,
                  message: "Staff can only complete bookings that are in confirmed status."
                });
              }
            } else if (status === "cancelled") {
              if (booking.status !== "pending" && booking.status !== "confirmed") {
                return res.status(400).json({
                  success: false,
                  message: "Staff can only cancel bookings that are pending or confirmed."
                });
              }
            } else if (status === "confirmed") {
              if (booking.status !== "pending") {
                return res.status(400).json({
                  success: false,
                  message: "Staff can only confirm bookings that are pending."
                });
              }
            } else {
              return res.status(403).json({
                success: false,
                message: `Forbidden. Staff are not allowed to set status to '${status}'.`
              });
            }
          }
        } else {
          // Customer
          // Customer must own the booking
          const bookingCustomerId = booking.customerId ? (booking.customerId._id ? booking.customerId._id.toString() : booking.customerId.toString()) : null;
          if (bookingCustomerId !== userId) {
            return res.status(403).json({
              success: false,
              message: "Forbidden. You are not allowed to update other users' bookings."
            });
          }

          // Customer cannot manually change payment status
          if (paymentStatus) {
            return res.status(403).json({
              success: false,
              message: "Forbidden. Customers are not allowed to update payment status manually."
            });
          }

          // Customer status transition validation
          if (status) {
            if (status === "cancelled") {
              if (booking.status !== "pending") {
                return res.status(400).json({
                  success: false,
                  message: "Customers can only cancel bookings that are in pending status."
                });
              }
            } else if (status === "request_refund") {
              if (booking.status !== "confirmed") {
                return res.status(400).json({
                  success: false,
                  message: "Customers can only request refund for confirmed bookings."
                });
              }
            } else {
              return res.status(403).json({
                success: false,
                message: `Forbidden. Customers are not allowed to set status to '${status}'.`
              });
            }
          }
        }
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
