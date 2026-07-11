const express = require("express");
const roomController = require("./room.controller");
const { authMiddleware, optionalAuthMiddleware, requirePermission } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, roomController.getAllRooms);
router.get("/:id", optionalAuthMiddleware, roomController.getRoomById);
router.post("/", authMiddleware, requirePermission("CREATE_ROOM"), roomController.createRoom);
router.put("/:id", authMiddleware, requirePermission("UPDATE_ROOM"), roomController.updateRoom);
router.patch("/:id/status", authMiddleware, requirePermission("UPDATE_ROOM_STATUS"), roomController.updateRoomStatus);

module.exports = router;
