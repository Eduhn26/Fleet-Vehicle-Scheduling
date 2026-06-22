const analyticsService = require('../services/analyticsService');

const health = async (req, res, next) => {
  try {
    const data = analyticsService.getAnalyticsHealth();

    return res.status(200).json({
      data,
      requestId: req.id,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  health,
};