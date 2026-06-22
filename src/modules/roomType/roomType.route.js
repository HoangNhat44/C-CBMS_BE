const express = require("express");
const roomTypeController = require("./roomType.controller");

const router = express.Router();

router.get("/", roomTypeController.getAllRoomTypes);
router.post("/", roomTypeController.createRoomType);
router.put("/:id", roomTypeController.updateRoomType);

module.exports = router;

