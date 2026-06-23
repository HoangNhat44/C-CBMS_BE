const accountRoutes = require("../modules/account/routes/user.route");
const roleRoutes = require("../modules/account/routes/role.route");
const branchRoutes = require("../modules/branch/branch.route");
const authRoutes = require("../modules/authentication/routes/auth.route");
const bookingRoutes = require("../modules/booking/routes/booking.route");
const productRoutes = require("../modules/product/product.route");
const paymentsRoutes = require("../modules/payments/routes/payments.route");
const promotionRoutes = require("../modules/promotion/promotion.route");
const roomRoutes = require("../modules/room/room.route");
const roomTypeRoutes = require("../modules/roomType/roomType.route");
const newsRoutes = require("../modules/news/news.route");
const categoryRoutes = require("../modules/category/category.route");
const feedbackRoutes = require("../modules/feedback/feedback.route");

module.exports = {
  accountRoutes,
  roleRoutes,
  branchRoutes,
  authRoutes,
  bookingRoutes,
  productRoutes,
  paymentsRoutes,
  promotionRoutes,
  roomRoutes,
  roomTypeRoutes,
  newsRoutes
  categoryRoutes,
  feedbackRoutes,
};
