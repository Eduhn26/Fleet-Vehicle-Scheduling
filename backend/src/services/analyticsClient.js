const ANALYTICS_SERVICE_DEFAULT_TIMEOUT_MS = 5000;

const normalizeUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const getAnalyticsServiceConfig = () => {
  const baseUrl = normalizeUrl(process.env.ANALYTICS_SERVICE_URL);
  const timeoutMs = Number(process.env.ANALYTICS_SERVICE_TIMEOUT_MS || '');

  return {
    configured: Boolean(baseUrl),
    baseUrl: baseUrl || null,
    timeoutMs:
      Number.isFinite(timeoutMs) && timeoutMs > 0
        ? timeoutMs
        : ANALYTICS_SERVICE_DEFAULT_TIMEOUT_MS,
  };
};

module.exports = {
  getAnalyticsServiceConfig,
};