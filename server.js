require("dotenv").config({ quiet: true });

const express = require("express");
const connectDB = require("./src/config/database");
const routes = require("./src/routes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "C-CBMS API is running",
  });
});

app.use("/api/users", routes.accountRoutes);
app.use("/api/branches", routes.branchRoutes);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
