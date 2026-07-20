const express = require("express");
const roomTypeController = require("./roomType.controller");
const { authMiddleware, requirePermission } = require("../../middlewares/auth.middleware");
const { uploadSingle } = require("../../middlewares/upload.middleware");

const router = express.Router();

router.get("/public", roomTypeController.getPublicRoomTypes);
router.get("/", authMiddleware, requirePermission("VIEW_ROOM_TYPE"), roomTypeController.getAllRoomTypes);
router.post("/", authMiddleware, requirePermission("CREATE_ROOM_TYPE"), uploadSingle("image"), roomTypeController.createRoomType);
router.put("/:id", authMiddleware, requirePermission("UPDATE_ROOM_TYPE"), uploadSingle("image"), roomTypeController.updateRoomType);

module.exports = router;

