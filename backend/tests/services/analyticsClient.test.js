const analyticsClient = require('../../src/services/analyticsClient');

describe('analyticsClient', () => {
  const originalUrl = process.env.ANALYTICS_SERVICE_URL;
  const originalTimeout = process.env.ANALYTICS_SERVICE_TIMEOUT_MS;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.ANALYTICS_SERVICE_URL = 'http://localhost:8000/';
    process.env.ANALYTICS_SERVICE_TIMEOUT_MS = '2500';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.ANALYTICS_SERVICE_URL;
    } else {
      process.env.ANALYTICS_SERVICE_URL = originalUrl;
    }

    if (originalTimeout === undefined) {
      delete process.env.ANALYTICS_SERVICE_TIMEOUT_MS;
    } else {
      process.env.ANALYTICS_SERVICE_TIMEOUT_MS = originalTimeout;
    }

    global.fetch = originalFetch;
  });

  test('normalizes analytics service configuration', () => {
    expect(analyticsClient.getAnalyticsServiceConfig()).toEqual({
      configured: true,
      baseUrl: 'http://localhost:8000',
      timeoutMs: 2500,
    });
  });

  test('sends dataset and filters to the Python overview endpoint', async () => {
    const responseBody = {
      status: 'OK',
      phase: '13.I',
      metrics: {
        summary: {
          totalRentals: 8,
        },
      },
    };

    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(JSON.stringify(responseBody)),
    });

    const dataset = {
      counts: {
        rentals: 39,
        vehicles: 6,
        users: 12,
        mileageHistory: 5,
      },
      rentals: [],
      vehicles: [],
      users: [],
      mileageHistory: [],
    };
    const filters = {
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      status: 'approved',
      vehicleId: null,
      department: 'Operações',
    };

    const result = await analyticsClient.requestAnalyticsOverview(
      dataset,
      filters
    );

    expect(result).toEqual(responseBody);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url, options] = global.fetch.mock.calls[0];

    expect(url).toBe('http://localhost:8000/internal/analytics/overview');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual(
      expect.objectContaining({
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
      })
    );
    expect(JSON.parse(options.body)).toEqual({
      dataset,
      filters,
    });
  });


test('sends a filtered Power BI export request to Python', async () => {
  const responseBody = {
    status: 'OK',
    phase: '13.I',
    table: 'rentals',
    filename: 'fleet-analytics-rentals.csv',
    csv: 'rentalId,status\nrental-1,approved\n',
  };

  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    text: jest.fn().mockResolvedValue(JSON.stringify(responseBody)),
  });

  const dataset = {
    counts: {},
    rentals: [],
    vehicles: [],
    users: [],
    mileageHistory: [],
  };
  const filters = { status: 'approved' };

  const result = await analyticsClient.requestAnalyticsExport(
    dataset,
    filters,
    'rentals'
  );

  expect(result).toEqual(responseBody);

  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toBe('http://localhost:8000/internal/analytics/export');
  expect(JSON.parse(options.body)).toEqual({
    dataset,
    filters,
    table: 'rentals',
  });
});

  test('maps unavailable service errors to a stable client error code', async () => {
    global.fetch.mockRejectedValue(new Error('connection refused'));

    await expect(
      analyticsClient.requestAnalyticsOverview(
        {
          counts: {},
          rentals: [],
          vehicles: [],
          users: [],
          mileageHistory: [],
        },
        {}
      )
    ).rejects.toMatchObject({
      name: 'AnalyticsServiceError',
      code: 'ANALYTICS_SERVICE_UNAVAILABLE',
    });
  });
});
