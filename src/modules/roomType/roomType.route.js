const express = require("express");
const roomTypeController = require("./roomType.controller");

const router = express.Router();

router.get("/", roomTypeController.getAllRoomTypes);

module.exports = router;
