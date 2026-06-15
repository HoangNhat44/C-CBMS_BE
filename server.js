require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/database");
const routes = require("./src/routes");

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use("/api/branches", routes.branchRoutes);
app.use("/api/auth", routes.authRoutes);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
