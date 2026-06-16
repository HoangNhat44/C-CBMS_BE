const accountRoutes = require("../modules/account/routes/user.route");
const branchRoutes = require("../modules/branch/branch.route");
const authRoutes = require("../modules/authenticaiton/routes/auth.route");
const bookingRoutes = require("../modules/booking/routes/booking.route");
const productRoutes = require("../modules/product/product.route");

module.exports = {
  accountRoutes,
  branchRoutes,
  authRoutes,
  bookingRoutes,
  productRoutes
};
