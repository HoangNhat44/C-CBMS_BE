const newsService = require("./news.service");

class NewsController {
  async getAllNews(req, res) {
    try {
      const result = await newsService.getAllNews();
      res.json({
        message: "Get news successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get news",
        error: error.message,
      });
    }
  }

  async getNewsById(req, res) {
    try {
      const result = await newsService.getNewsById(req.params.id);
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Get news successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get news",
        error: error.message,
      });
    }
  }

  async createNews(req, res) {
    try {
      const result = await newsService.createNews(req.body);
      res.status(201).json({
        message: "Create news successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to create news",
        error: error.message,
      });
    }
  }

  async updateNews(req, res) {
    try {
      const result = await newsService.updateNews(req.params.id, req.body);
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Update news successfully",
        ...result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update news",
        error: error.message,
      });
    }
  }

  async deleteNews(req, res) {
    try {
      const result = await newsService.deleteNews(req.params.id);
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        message: "Delete news successfully",
        ...result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete news",
        error: error.message,
      });
    }
  }
}

module.exports = new NewsController();
