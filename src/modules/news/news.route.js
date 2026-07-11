const express = require("express");
const newsController = require("./news.controller");
const { authMiddleware, optionalAuthMiddleware, requirePermission } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, newsController.getAllNews);
router.get("/:id", optionalAuthMiddleware, newsController.getNewsById);
router.post("/", authMiddleware, requirePermission("CREATE_NEWS"), newsController.createNews);
router.put("/:id", authMiddleware, requirePermission("UPDATE_NEWS"), newsController.updateNews);
router.delete("/:id", authMiddleware, requirePermission("DELETE_NEWS"), newsController.deleteNews);

module.exports = router;
