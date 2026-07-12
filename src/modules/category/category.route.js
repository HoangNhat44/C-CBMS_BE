const express = require("express");
const categoryController = require("./category.controller");
const { authMiddleware, optionalAuthMiddleware, requirePermission } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, categoryController.getAllCategories);
router.get("/:id", optionalAuthMiddleware, categoryController.getCategoryById);
router.post("/", authMiddleware, requirePermission("CREATE_PRODUCT"), categoryController.createCategory);
router.put("/:id", authMiddleware, requirePermission("UPDATE_PRODUCT"), categoryController.updateCategory);
router.delete("/:id", authMiddleware, requirePermission("DELETE_PRODUCT"), categoryController.deleteCategory);

module.exports = router;
