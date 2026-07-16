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

const overview = async (req, res, next) => {
  try {
    const data = await analyticsService.getAnalyticsOverview(req.query);

    return res.status(200).json({
      data,
      requestId: req.id,
    });
  } catch (error) {
    return next(error);
  }
};

const exportJson = async (req, res, next) => {
  try {
    const data = await analyticsService.getAnalyticsExport(req.query);
    const filename = data.filename || 'fleet-analytics-power-bi.json';

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(JSON.stringify(data, null, 2));
  } catch (error) {
    return next(error);
  }
};

const exportCsv = async (req, res, next) => {
  try {
    const data = await analyticsService.getAnalyticsExport(
      req.query,
      req.query.table
    );
    const filename = data.filename || 'fleet-analytics.csv';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(`\uFEFF${data.csv || ''}`);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  health,
  overview,
  exportJson,
  exportCsv,
};
