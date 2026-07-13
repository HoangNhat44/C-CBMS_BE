const express = require("express");
const productController = require("./product.controller");
const { authMiddleware, optionalAuthMiddleware, requirePermission } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, productController.getAllProducts);
router.get("/:id", optionalAuthMiddleware, productController.getProductById);
router.post("/", authMiddleware, requirePermission("CREATE_PRODUCT"), productController.createProduct);
router.put("/:id", authMiddleware, requirePermission("UPDATE_PRODUCT"), productController.updateProduct);
router.delete("/:id", authMiddleware, requirePermission("DELETE_PRODUCT"), productController.deleteProduct);

module.exports = router;
