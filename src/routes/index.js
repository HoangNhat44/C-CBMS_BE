const accountRoutes = require("../modules/account/routes/user.route");
const roleRoutes = require("../modules/account/routes/role.route");
const branchRoutes = require("../modules/branch/branch.route");
const authRoutes = require("../modules/authenticaiton/routes/auth.route");
const bookingRoutes = require("../modules/booking/routes/booking.route");
const productRoutes = require("../modules/product/product.route");
const paymentsRoutes = require("../modules/payments/routes/payments.route");
const promotionRoutes = require("../modules/promotion/promotion.route");

module.exports = {
  accountRoutes,
  branchRoutes,
  authRoutes,
  bookingRoutes,
  productRoutes,
  paymentsRoutes,
  promotionRoutes
};
