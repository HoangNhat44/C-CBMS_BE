const Room = require("../../models/room.model");

class RoomService {
  async createRoom(data) {
    try {
      const room = await Room.create(data);
      const populatedRoom = await Room.findById(room._id)
        .populate("branchId")
        .populate("roomTypeId");

      return { success: true, data: populatedRoom };
    } catch (error) {
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  async getAllRooms(filter = {}) {
    try {
      const rooms = await Room.find(filter)
        .populate("branchId")
        .populate("roomTypeId")
        .sort({ createdAt: -1 });

      return { success: true, data: rooms };
    } catch (error) {
      throw new Error(`Failed to get rooms: ${error.message}`);
    }
  }

  async getRoomById(id) {
    try {
      const room = await Room.findById(id)
        .populate("branchId")
        .populate("roomTypeId");

      if (!room) {
        return { success: false, message: "Room not found" };
      }

      return { success: true, data: room };
    } catch (error) {
      throw new Error(`Failed to get room: ${error.message}`);
    }
  }

  async updateRoom(id, data) {
    try {
      const room = await Room.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
        .populate("branchId")
        .populate("roomTypeId");

      if (!room) {
        return { success: false, message: "Room not found" };
      }

      return { success: true, data: room };
    } catch (error) {
      throw new Error(`Failed to update room: ${error.message}`);
    }
  }

  async updateRoomStatus(id, status) {
    return this.updateRoom(id, { status });
  }
}

module.exports = new RoomService();
