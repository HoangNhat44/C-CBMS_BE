const Booking = require("../../../models/booking.model");
const User = require("../../../models/users.model");
const Branch = require("../../../models/branch.model");
const Room = require("../../../models/room.model");
const Slot = require("../../../models/slot.model");
const RoomPrice = require("../../../models/roomPrice.model");
const Product = require("../../../models/product.model");
const RoomType = require("../../../models/roomType.model");

// Helper to calculate hours between two "HH:MM" strings
function calculateDurationInHours(startTime, endTime) {
  try {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    
    if (isNaN(startMin) || isNaN(endMin) || endMin <= startMin) {
      return 1; // Default fallback duration
    }
    
    const diffHours = (endMin - startMin) / 60;
    return parseFloat(diffHours.toFixed(2));
  } catch (err) {
    return 1;
  }
}

// Helper to determine day type (weekday, weekend)
function getDayType(dateStr) {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay(); // Sunday = 0, Saturday = 6
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return "weekend";
  }
  return "weekday";
}

class BookingService {
  // Check room availability for a date and slot
  async checkAvailability(roomId, bookingDate, slotId) {
    try {
      const startOfDay = new Date(bookingDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(bookingDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Check if room is available
      const room = await Room.findById(roomId);
      if (!room || room.status !== "available") {
        return { available: false, reason: "Room is not available or under maintenance" };
      }

      // Find conflicting bookings for this room, date, and slot
      const conflictingBooking = await Booking.findOne({
        roomId,
        $or: [
          { slotId: slotId },
          { slotIds: slotId }
        ],
        bookingDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ["pending", "confirmed", "completed"] }
      });

      if (conflictingBooking) {
        return { available: false, reason: "Room is already booked for this slot" };
      }

      return { available: true };
    } catch (error) {
      throw new Error(`Failed to check availability: ${error.message}`);
    }
  }

  // Get all bookings with optional filters
  async getAllBookings(filters = {}) {
    try {
      const query = {};
      
      if (filters.customerId) query.customerId = filters.customerId;
      if (filters.branchId) query.branchId = filters.branchId;
      if (filters.roomId) query.roomId = filters.roomId;
      if (filters.status) query.status = filters.status;
      if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
      
      if (filters.bookingDate) {
        const startOfDay = new Date(filters.bookingDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.bookingDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.bookingDate = { $gte: startOfDay, $lte: endOfDay };
      }

      const bookings = await Booking.find(query)
        .populate("customerId", "fullName email phone")
        .populate("branchId", "name address phone")
        .populate("roomId", "roomName roomTypeId capacity")
        .populate("slotId", "name startTime endTime")
        .populate("slotIds", "name startTime endTime")
        .populate("appliedPromotions")
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: bookings,
      };
    } catch (error) {
      throw new Error(`Failed to get bookings: ${error.message}`);
    }
  }

  // Get booking details by ID
  async getBookingById(bookingId) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate("customerId", "fullName email phone")
        .populate("branchId", "name address phone")
        .populate("roomId", "roomName roomTypeId capacity")
        .populate("slotId", "name startTime endTime")
        .populate("slotIds", "name startTime endTime")
        .populate("appliedPromotions");

      if (!booking) {
        return {
          success: false,
          message: "Booking not found",
        };
      }

      return {
        success: true,
        data: booking,
      };
    } catch (error) {
      throw new Error(`Failed to get booking details: ${error.message}`);
    }
  }

  // Create a new booking
  async createBooking(bookingData) {
    try {
      const {
        customerId,
        guestInfo,
        branchId,
        roomId,
        slotId,
        slotIds,
        bookingDate,
        products = [],
        note = "",
        appliedPromotions = []
      } = bookingData;

      let resolvedCustomerId = customerId;

      if (!resolvedCustomerId) {
        if (!guestInfo || !guestInfo.fullName || !guestInfo.email || !guestInfo.phone) {
          return {
            success: false,
            statusCode: 400,
            message: "Thông tin khách hàng hoặc thông tin khách vãng lai (Tên, Email, SĐT) là bắt buộc."
          };
        }

        const normalizedEmail = guestInfo.email.trim().toLowerCase();
        let guestUser = await User.findOne({ email: normalizedEmail });

        if (!guestUser) {
          const Role = require("../../../models/role.model");
          const role = await Role.findOne({ name: "customer", isActive: true });
          if (!role) {
            return {
              success: false,
              statusCode: 500,
              message: "Không tìm thấy vai trò 'customer' trong hệ thống."
            };
          }

          const { hashPassword } = require("../../../utils/password.util");
          const defaultPassword = "GuestPassword123!";
          const hashedPassword = await hashPassword(defaultPassword);

          guestUser = await User.create({
            fullName: guestInfo.fullName.trim(),
            email: normalizedEmail,
            phone: guestInfo.phone.trim(),
            password: hashedPassword,
            roleId: role._id,
            isActive: true
          });
        }
        resolvedCustomerId = guestUser._id;
      }

      // 1. Validate customer existence
      const customer = await User.findById(resolvedCustomerId);
      if (!customer) {
        return { success: false, statusCode: 404, message: "Customer not found." };
      }

      // 2. Validate branch existence
      const branch = await Branch.findById(branchId);
      if (!branch || !branch.isActive) {
        return { success: false, statusCode: 404, message: "Branch not found or inactive." };
      }

      // 3. Validate room existence
      const room = await Room.findById(roomId);
      if (!room || room.status !== "available") {
        return { success: false, statusCode: 404, message: "Room not found or currently unavailable." };
      }
      
      if (room.branchId.toString() !== branchId.toString()) {
        return { success: false, statusCode: 400, message: "Room does not belong to the specified branch." };
      }

      // 4. Resolve slots
      const resolvedSlotIds = slotIds && slotIds.length > 0 ? slotIds : (slotId ? [slotId] : []);
      if (resolvedSlotIds.length === 0) {
        return { success: false, statusCode: 400, message: "At least one slot must be selected." };
      }

      const slots = await Slot.find({ _id: { $in: resolvedSlotIds }, isActive: true });
      if (slots.length !== resolvedSlotIds.length) {
        return { success: false, statusCode: 400, message: "One or more selected slots are invalid or inactive." };
      }

      // 5. Check room availability (prevent double booking)
      for (const sId of resolvedSlotIds) {
        const availability = await this.checkAvailability(roomId, bookingDate, sId);
        if (!availability.available) {
          return { success: false, statusCode: 409, message: `Slot is already booked: ${availability.reason}` };
        }
      }

      // 6. Calculate total slot hours
      let totalHours = 0;
      for (const slotItem of slots) {
        totalHours += calculateDurationInHours(slotItem.startTime, slotItem.endTime);
      }

      // 7. Determine day type (weekday, weekend only)
      const dayType = getDayType(bookingDate);

      // 8. Fetch room price for priceSnapshot and roomPriceSnapshots
      let roomTotal = 0;
      const roomPriceSnapshots = [];

      for (const slotItem of slots) {
        const priceConfig = await RoomPrice.findOne({
          branchId,
          roomTypeId: room.roomTypeId,
          slotId: slotItem._id,
          dayType,
          isActive: true
        });

        if (!priceConfig) {
          return {
            success: false,
            statusCode: 400,
            message: `Pricing is not configured for Slot ${slotItem.name} at this branch.`
          };
        }

        const pricePerHour = priceConfig.pricePerHour;
        const slotHours = calculateDurationInHours(slotItem.startTime, slotItem.endTime);
        roomTotal += pricePerHour * slotHours;

        roomPriceSnapshots.push({
          slotId: slotItem._id,
          pricePerHour
        });
      }

      // Keep legacy snapshot compatibility by referencing the first slot
      const firstPriceConfig = await RoomPrice.findOne({
        branchId,
        roomTypeId: room.roomTypeId,
        slotId: resolvedSlotIds[0],
        dayType,
        isActive: true
      });
      const roomPriceSnapshot = firstPriceConfig ? {
        roomTypeId: room.roomTypeId,
        slotId: resolvedSlotIds[0],
        pricePerHour: firstPriceConfig.pricePerHour
      } : undefined;

      // Sort slots chronologically to set overall startTime and endTime
      const sortedSlots = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
      const overallStartTime = sortedSlots[0].startTime;
      const overallEndTime = sortedSlots[sortedSlots.length - 1].endTime;

      // 9. Calculate product charges
      const parsedProducts = [];
      let productTotal = 0;

      for (const item of products) {
        const product = await Product.findById(item.productId);
        if (!product || !product.isActive) {
          return {
            success: false,
            statusCode: 404,
            message: `Product with ID ${item.productId} not found or inactive.`
          };
        }

        const quantity = item.quantity || 1;
        const total = product.price * quantity;
        productTotal += total;

        parsedProducts.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity,
          total
        });
      }

      // 10. Compute grand totals using promotion calculation
      const promotionService = require("../../promotion/promotion.service");
      const discountResult = await promotionService.calculateDiscount(roomTotal + productTotal, appliedPromotions);
      
      const calculatedDiscountAmount = discountResult.success ? discountResult.data.discountAmount : 0;
      const finalTotal = discountResult.success ? discountResult.data.finalTotal : (roomTotal + productTotal);

      // 11. Save booking to DB
      const booking = await Booking.create({
        customerId: resolvedCustomerId,
        branchId,
        roomId,
        slotId: resolvedSlotIds[0],
        slotIds: resolvedSlotIds,
        bookingDate: new Date(bookingDate),
        startTime: overallStartTime,
        endTime: overallEndTime,
        totalHours,
        dayType,
        roomPriceSnapshot,
        roomPriceSnapshots,
        products: parsedProducts,
        roomTotal,
        productTotal,
        discountAmount: calculatedDiscountAmount,
        appliedPromotions,
        finalTotal,
        status: "pending",
        paymentStatus: "unpaid",
        note
      });

      // Confirm promotion usage
      if (appliedPromotions && appliedPromotions.length > 0) {
        try {
          await promotionService.confirmUsage(appliedPromotions);
        } catch (confirmError) {
          console.error("[Promotion Error] Failed to confirm usage for promotions:", confirmError.message);
        }
      }

      // Populate response
      const populatedBooking = await Booking.findById(booking._id)
        .populate("customerId", "fullName email phone")
        .populate("branchId", "name address phone")
        .populate("roomId", "roomName roomTypeId capacity")
        .populate("slotId", "name startTime endTime")
        .populate("slotIds", "name startTime endTime")
        .populate("appliedPromotions");

      // Send success email asynchronously
      if (populatedBooking && populatedBooking.customerId && populatedBooking.customerId.email) {
        const { EmailService } = require("../../../config/email.service");
        EmailService.sendBookingSuccessEmail({
          to: populatedBooking.customerId.email,
          fullName: populatedBooking.customerId.fullName || "Quý khách",
          booking: populatedBooking
        }).catch((err) => {
          console.error("[Email Error] Failed to send booking success email:", err.message);
        });
      }

      return {
        success: true,
        statusCode: 201,
        data: populatedBooking
      };
    } catch (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }
  }

  // Get booking layout for a branch and date
  async getBookingLayout(branchId, dateStr) {
    try {
      const date = new Date(dateStr);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // 1. Get Day Type
      const dayType = getDayType(dateStr);

      // 2. Fetch all active slots
      const slots = await Slot.find({ isActive: true }).sort({ startTime: 1 });

      // 3. Fetch all active room types
      const roomTypes = await RoomType.find({ isActive: true });

      // 4. Fetch all available rooms for this branch
      const rooms = await Room.find({ branchId, status: "available" }).populate("roomTypeId");

      // 5. Fetch all room prices for this branch and day type
      const prices = await RoomPrice.find({
        branchId,
        dayType,
        isActive: true
      });

      // 6. Fetch existing bookings for this branch and date
      const bookings = await Booking.find({
        branchId,
        bookingDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ["pending", "confirmed", "completed"] }
      });

      // 7. Structure the response
      const roomTypeMap = new Map();
      roomTypes.forEach(rt => {
        roomTypeMap.set(rt._id.toString(), {
          roomType: {
            id: rt._id,
            name: rt.name,
            description: rt.description,
            capacity: rt.capacity
          },
          rooms: []
        });
      });

      for (const room of rooms) {
        const rtId = room.roomTypeId._id.toString();
        if (!roomTypeMap.has(rtId)) continue;

        // For this room, evaluate slot states (price and availability)
        const roomSlots = slots.map(slot => {
          // Find pricing for this slot
          const priceObj = prices.find(p => 
            p.roomTypeId.toString() === rtId && 
            p.slotId.toString() === slot._id.toString()
          );

          const pricePerHour = priceObj ? priceObj.pricePerHour : 0;
          const totalHours = calculateDurationInHours(slot.startTime, slot.endTime);
          const price = pricePerHour * totalHours;

          // Check if slot is booked
          const isBooked = bookings.some(b => 
            b.roomId.toString() === room._id.toString() && 
            (b.slotId.toString() === slot._id.toString() || 
             (b.slotIds && b.slotIds.some(id => id.toString() === slot._id.toString())))
          );

          return {
            slotId: slot._id,
            name: slot.name,
            startTime: slot.startTime,
            endTime: slot.endTime,
            timeType: slot.timeType,
            pricePerHour,
            price,
            isBooked
          };
        });

        roomTypeMap.get(rtId).rooms.push({
          roomId: room._id,
          roomName: room.roomName,
          capacity: room.capacity,
          facilities: room.facilities,
          images: room.images,
          slots: roomSlots
        });
      }

      // Convert map to array
      const result = Array.from(roomTypeMap.values()).filter(item => item.rooms.length > 0);

      return {
        success: true,
        data: {
          dayType,
          date: dateStr,
          layout: result
        }
      };
    } catch (error) {
      throw new Error(`Failed to get booking layout: ${error.message}`);
    }
  }

  // Update booking or payment status
  async updateStatus(bookingId, statusData) {
    try {
      const { status, paymentStatus } = statusData;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return {
          success: false,
          statusCode: 404,
          message: "Booking not found"
        };
      }

      const previousStatus = booking.status;

      // Check if transitioning to cancelled or refunded
      if (status && (status === "cancelled" || status === "refunded")) {
        if (previousStatus !== "cancelled" && previousStatus !== "refunded") {
          if (booking.appliedPromotions && booking.appliedPromotions.length > 0) {
            try {
              const promotionService = require("../../promotion/promotion.service");
              await promotionService.revertUsage(booking.appliedPromotions);
            } catch (revertError) {
              console.error("[Promotion Revert Error] Failed to revert usage on updateStatus:", revertError.message);
            }
          }
        }
      }

      if (status) booking.status = status;
      if (paymentStatus) booking.paymentStatus = paymentStatus;

      await booking.save();

      const populatedBooking = await Booking.findById(booking._id)
        .populate("customerId", "fullName email phone")
        .populate("branchId", "name address phone")
        .populate("roomId", "roomName roomTypeId capacity")
        .populate("slotId", "name startTime endTime")
        .populate("slotIds", "name startTime endTime")
        .populate("appliedPromotions");

      return {
        success: true,
        statusCode: 200,
        data: populatedBooking
      };
    } catch (error) {
      throw new Error(`Failed to update booking status: ${error.message}`);
    }
  }

  // Delete/Cancel booking record from db
  async deleteBooking(bookingId) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return {
          success: false,
          statusCode: 404,
          message: "Booking not found"
        };
      }

      // Revert promotion if applicable
      if (booking.appliedPromotions && booking.appliedPromotions.length > 0) {
        try {
          const promotionService = require("../../promotion/promotion.service");
          await promotionService.revertUsage(booking.appliedPromotions);
        } catch (revertError) {
          console.error("[Promotion Revert Error] Failed to revert usage on deleteBooking:", revertError.message);
        }
      }

      await booking.deleteOne();

      return {
        success: true,
        statusCode: 200,
        message: "Booking deleted successfully"
      };
    } catch (error) {
      throw new Error(`Failed to delete booking: ${error.message}`);
    }
  }

  // Start the interval job to auto-cancel pending bookings older than 15 minutes
  startAutoCancelJob(io) {
    const Payment = require("../../../models/payment.model");
    
    setInterval(async () => {
      try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        
        // Find pending bookings older than 15 minutes
        const expiredBookings = await Booking.find({
          status: "pending",
          createdAt: { $lt: fifteenMinutesAgo }
        });

        if (expiredBookings.length > 0) {
          const expiredIds = expiredBookings.map((b) => b._id);

          // Revert promotions for these expired bookings
          const promotionService = require("../../promotion/promotion.service");
          for (const booking of expiredBookings) {
            if (booking.appliedPromotions && booking.appliedPromotions.length > 0) {
              try {
                await promotionService.revertUsage(booking.appliedPromotions);
              } catch (revertError) {
                console.error(`[Promotion Revert Error] Failed to revert usage on auto-cancel for booking ${booking._id}:`, revertError.message);
              }
            }
          }

          // Cancel bookings
          await Booking.updateMany(
            { _id: { $in: expiredIds } },
            { $set: { status: "cancelled" } }
          );

          // Expire corresponding payments
          await Payment.updateMany(
            { bookingId: { $in: expiredIds }, status: { $in: ["pending", "processing"] } },
            { $set: { status: "expired" } }
          );

          console.log(`[Auto-Cancel] Cancelled ${expiredBookings.length} expired pending bookings.`);

          // Notify clients in real-time
          expiredBookings.forEach((booking) => {
            if (io) {
              io.emit("booking:updated", {
                branchId: booking.branchId,
                roomId: booking.roomId,
                slotId: booking.slotId,
                bookingDate: booking.bookingDate,
                status: "cancelled"
              });
            }
          });
        }
      } catch (error) {
        console.error("[Auto-Cancel Error] Failed to run auto-cancel job:", error);
      }
    }, 60 * 1000);
  }
}

module.exports = new BookingService();
