const express = require("express");
const feedbackController = require("./feedback.controller");
const { authMiddleware, optionalAuthMiddleware, requirePermission } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, feedbackController.getAllFeedbacks);
router.get("/:id", optionalAuthMiddleware, feedbackController.getFeedbackById);
router.post("/", authMiddleware, requirePermission("CREATE_FEEDBACK"), feedbackController.createFeedback);
router.put("/:id", authMiddleware, requirePermission("EDIT_FEEDBACK"), feedbackController.updateFeedback);
router.delete("/:id", authMiddleware, requirePermission("DELETE_FEEDBACK"), feedbackController.deleteFeedback);

module.exports = router;
