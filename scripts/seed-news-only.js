const mongoose = require("mongoose");
require("dotenv").config({ quiet: true });

const News = require("../src/models/news.model");

const OWNER_PLACEHOLDER_ID = new mongoose.Types.ObjectId("000000000000000000000001");

const sampleNews = [
  {
    title: "C-CBMS khai trương khu phòng mới",
    content:
      "Hệ thống phòng mới được nâng cấp không gian, âm thanh và tiện ích để phục vụ khách hàng tốt hơn.",
    image: "",
    createdBy: OWNER_PLACEHOLDER_ID,
    isActive: true,
  },
  {
    title: "Ưu đãi đặt phòng trong tuần",
    content:
      "Khách hàng đặt phòng từ thứ hai đến thứ năm sẽ nhận thêm ưu đãi cho các dịch vụ đi kèm.",
    image: "",
    createdBy: OWNER_PLACEHOLDER_ID,
    isActive: true,
  },
  {
    title: "Thông báo bảo trì hệ thống đặt phòng",
    content:
      "C-CBMS sẽ bảo trì hệ thống trong thời gian ngắn để cải thiện tốc độ xử lý và độ ổn định.",
    image: "",
    createdBy: OWNER_PLACEHOLDER_ID,
    isActive: true,
  },
];

async function seedNewsOnly() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in .env");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await News.createCollection();

  const count = await News.countDocuments();
  if (count === 0) {
    await News.insertMany(sampleNews);
    console.log(`Inserted ${sampleNews.length} news documents into news collection.`);
  } else {
    console.log(`News collection already has ${count} documents. No documents inserted.`);
  }

  await mongoose.disconnect();
}

seedNewsOnly().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
