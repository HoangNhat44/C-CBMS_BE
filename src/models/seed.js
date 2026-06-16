require("dotenv").config();

const mongoose = require("mongoose");
const Role = require("./role.model");

async function seedRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected");

    const roles = [
      {
        name: "owner",
        description: "Chủ sở hữu",
      },
      {
        name: "admin",
        description: "Quản trị viên",
      },
      {
        name: "staff",
        description: "Nhân viên",
      },
      {
        name: "customer",
        description: "Khách hàng",
      },
      {
        name: "guest",
        description: "Khách vãng lai",
      },
    ];

    for (const role of roles) {
      await Role.updateOne(
        { name: role.name },
        { $set: role },
        { upsert: true }
      );
    }

    console.log("Roles seeded successfully");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seedRoles();