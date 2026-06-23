// DNS override for local network glitches
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./src/config/database");
const routes = require("./src/routes");

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "C-CBMS API is running",
  });
});

app.use("/api/users", routes.accountRoutes);
app.use("/api/roles", routes.roleRoutes);
app.use("/api/branches", routes.branchRoutes);
app.use("/api/bookings", routes.bookingRoutes);
app.use("/api/auth", routes.authRoutes);
app.use("/api/products", routes.productRoutes);
app.use("/api/payments", routes.paymentsRoutes);
app.use("/api/promotions", routes.promotionRoutes);
app.use("/api/rooms", routes.roomRoutes);
app.use("/api/room-types", routes.roomTypeRoutes);
app.use("/api/news", routes.newsRoutes);
app.use("/api/categories", routes.categoryRoutes);
app.use("/api/feedbacks", routes.feedbackRoutes);

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Initialize auto-cancellation for expired pending bookings
  const bookingService = require("./src/modules/booking/services/booking.service");
  bookingService.startAutoCancelJob(io);
};

startServer();
