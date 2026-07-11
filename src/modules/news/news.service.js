const mongoose = require("mongoose");
const News = require("../../models/news.model");

const OWNER_PLACEHOLDER_ID = new mongoose.Types.ObjectId("000000000000000000000001");

class NewsService {
  async getAllNews() {
    try {
      const news = await News.find().sort({ createdAt: -1 });
      return { success: true, data: news };
    } catch (error) {
      throw new Error(`Failed to get news: ${error.message}`);
    }
  }

  async getNewsById(id) {
    try {
      const news = await News.findById(id);
      if (!news) {
        return { success: false, message: "News not found" };
      }

      return { success: true, data: news };
    } catch (error) {
      throw new Error(`Failed to get news: ${error.message}`);
    }
  }

  async createNews(data) {
    try {
      const news = await News.create({
        ...data,
        createdBy: data.createdBy || OWNER_PLACEHOLDER_ID,
      });

      return { success: true, data: news };
    } catch (error) {
      throw new Error(`Failed to create news: ${error.message}`);
    }
  }

  async updateNews(id, data) {
    try {
      const news = await News.findByIdAndUpdate(id, data, {
        returnDocument: 'after',
        runValidators: true,
      });

      if (!news) {
        return { success: false, message: "News not found" };
      }

      return { success: true, data: news };
    } catch (error) {
      throw new Error(`Failed to update news: ${error.message}`);
    }
  }

  async deleteNews(id) {
    try {
      const news = await News.findByIdAndDelete(id);

      if (!news) {
        return { success: false, message: "News not found" };
      }

      return { success: true, data: news };
    } catch (error) {
      throw new Error(`Failed to delete news: ${error.message}`);
    }
  }
}

module.exports = new NewsService();
