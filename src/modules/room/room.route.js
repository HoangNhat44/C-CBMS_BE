const express = require("express");
const roomController = require("./room.controller");
const { authMiddleware, optionalAuthMiddleware, requirePermission } = require("../../middlewares/auth.middleware");
const { uploadMultiple } = require("../../middlewares/upload.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, roomController.getAllRooms);
router.get("/:id", optionalAuthMiddleware, roomController.getRoomById);
router.post("/", authMiddleware, requirePermission("CREATE_ROOM"), uploadMultiple("images", 10), roomController.createRoom);
router.put("/:id", authMiddleware, requirePermission("UPDATE_ROOM"), uploadMultiple("images", 10), roomController.updateRoom);
router.patch("/:id/status", authMiddleware, requirePermission("UPDATE_ROOM_STATUS"), roomController.updateRoomStatus);

module.exports = router;
