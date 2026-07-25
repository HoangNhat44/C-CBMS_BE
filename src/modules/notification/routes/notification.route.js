const express = require("express");
const notificationController = require("../controller/notification.controller");
const { authMiddleware } = require("../../../middlewares/auth.middleware");

const router = express.Router();

// Apply authMiddleware globally to all notification endpoints
router.use(authMiddleware);

router.get("/", notificationController.getNotifications);
router.put("/read-all", notificationController.markAllAsRead);
router.put("/:id/read", notificationController.markAsRead);

module.exports = router;
