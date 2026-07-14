const ANALYTICS_SERVICE_DEFAULT_TIMEOUT_MS = 5000;

class AnalyticsServiceError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'AnalyticsServiceError';
    this.code = options.code || 'ANALYTICS_SERVICE_ERROR';
    this.statusCode = options.statusCode || null;
    this.cause = options.cause || null;
  }
}

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

const parseResponseBody = async (response) => {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_) {
    return {
      message: text,
    };
  }
};

const requestJson = async (path, options = {}) => {
  const config = getAnalyticsServiceConfig();

  if (!config.configured) {
    throw new AnalyticsServiceError('Analytics service is not configured.', {
      code: 'ANALYTICS_SERVICE_NOT_CONFIGURED',
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    const body = await parseResponseBody(response);

    if (!response.ok) {
      throw new AnalyticsServiceError(
        `Analytics service returned HTTP ${response.status}.`,
        {
          code: 'ANALYTICS_SERVICE_HTTP_ERROR',
          statusCode: response.status,
        }
      );
    }

    return body;
  } catch (error) {
    if (error instanceof AnalyticsServiceError) {
      throw error;
    }

    if (error && error.name === 'AbortError') {
      throw new AnalyticsServiceError('Analytics service request timed out.', {
        code: 'ANALYTICS_SERVICE_TIMEOUT',
        cause: error,
      });
    }

    throw new AnalyticsServiceError('Analytics service is unavailable.', {
      code: 'ANALYTICS_SERVICE_UNAVAILABLE',
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const requestAnalyticsOverview = (dataset, filters = {}) =>
  requestJson('/internal/analytics/overview', {
    method: 'POST',
    body: JSON.stringify({
      dataset,
      filters,
    }),
  });

module.exports = {
  AnalyticsServiceError,
  getAnalyticsServiceConfig,
  requestAnalyticsOverview,
};
