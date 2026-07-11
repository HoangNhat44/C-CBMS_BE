const express = require("express");
const productController = require("./product.controller");
const { authMiddleware, requirePermission } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, requirePermission("VIEW_PRODUCT"), productController.getAllProducts);
router.get("/:id", authMiddleware, requirePermission("VIEW_PRODUCT"), productController.getProductById);
router.post("/", authMiddleware, requirePermission("CREATE_PRODUCT"), productController.createProduct);
router.put("/:id", authMiddleware, requirePermission("UPDATE_PRODUCT"), productController.updateProduct);
router.delete("/:id", authMiddleware, requirePermission("DELETE_PRODUCT"), productController.deleteProduct);

module.exports = router;
