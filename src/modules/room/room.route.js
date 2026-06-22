const express = require("express");
const roomController = require("./room.controller");

const router = express.Router();

router.get("/", roomController.getAllRooms);
router.get("/:id", roomController.getRoomById);
router.post("/", roomController.createRoom);
router.put("/:id", roomController.updateRoom);
router.patch("/:id/status", roomController.updateRoomStatus);

module.exports = router;
