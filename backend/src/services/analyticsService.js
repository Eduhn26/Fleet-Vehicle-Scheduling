const analyticsClient = require('./analyticsClient');

const getAnalyticsHealth = () => {
  const clientConfig = analyticsClient.getAnalyticsServiceConfig();

  return {
    status: 'OK',
    service: 'fleet-analytics-boundary',
    phase: '13.B',
    source: 'node-backend',
    message: 'Analytics backend boundary is ready.',
    pythonAnalyticsService: {
      configured: clientConfig.configured,
      baseUrl: clientConfig.baseUrl,
      timeoutMs: clientConfig.timeoutMs,
      status: clientConfig.configured ? 'configured' : 'not_configured',
    },
    nextStep: '13.C - Normalize fleet analytics dataset',
  };
};

module.exports = {
  getAnalyticsHealth,
};