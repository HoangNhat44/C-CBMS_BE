const accountRoutes = require("../modules/account/routes/user.route");
const roleRoutes = require("../modules/account/routes/role.route");
const permissionRoutes = require("../modules/account/routes/permission.route");
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
const refundRoutes = require("../modules/refund/routes/refund.route");
const slotRoutes = require("../modules/slot/slot.route");
const profileRoutes = require("../modules/profile/profile.route");
const roomPriceRoutes = require("../modules/roomPrice/roomPrice.route");

module.exports = {
  accountRoutes,
  roleRoutes,
  permissionRoutes,
  branchRoutes,
  authRoutes,
  bookingRoutes,
  productRoutes,
  paymentsRoutes,
  promotionRoutes,
  roomRoutes,
  roomTypeRoutes,
  newsRoutes,
  categoryRoutes,
  feedbackRoutes,
  refundRoutes,
  slotRoutes,
  profileRoutes,
  roomPriceRoutes,
};

