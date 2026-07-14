jest.mock('../../src/services/analyticsClient');
jest.mock('../../src/models/RentalRequest', () => ({
  RentalRequest: {
    find: jest.fn(),
  },
}));
jest.mock('../../src/models/Vehicle', () => ({
  Vehicle: {
    find: jest.fn(),
  },
}));
jest.mock('../../src/models/User', () => ({
  User: {
    find: jest.fn(),
  },
}));
jest.mock('../../src/models/VehicleMileageHistory', () => ({
  VehicleMileageHistory: {
    find: jest.fn(),
  },
}));

const analyticsClient = require('../../src/services/analyticsClient');
const { RentalRequest } = require('../../src/models/RentalRequest');
const { Vehicle } = require('../../src/models/Vehicle');
const { User } = require('../../src/models/User');
const {
  VehicleMileageHistory,
} = require('../../src/models/VehicleMileageHistory');
const analyticsService = require('../../src/services/analyticsService');

const sortAndLean = (value) => ({
  sort: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(value),
  }),
});

const selectSortAndLean = (value) => ({
  select: jest.fn().mockReturnValue(sortAndLean(value)),
});

describe('analyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    RentalRequest.find.mockReturnValue(sortAndLean([]));
    Vehicle.find.mockReturnValue(sortAndLean([]));
    User.find.mockReturnValue(selectSortAndLean([]));
    VehicleMileageHistory.find.mockReturnValue(sortAndLean([]));

    analyticsClient.getAnalyticsServiceConfig.mockReturnValue({
      configured: true,
      baseUrl: 'http://localhost:8000',
      timeoutMs: 5000,
    });
  });

  test('returns Python metrics through the Node analytics boundary', async () => {
    analyticsClient.requestAnalyticsOverview.mockResolvedValue({
      status: 'OK',
      phase: '13.E',
      receivedCounts: {
        rentals: 0,
        vehicles: 0,
        users: 0,
        mileageHistory: 0,
      },
      warnings: [],
      insights: ['Dataset processed.'],
      metrics: {
        summary: {
          totalRentals: 0,
        },
      },
    });

    const result = await analyticsService.getAnalyticsOverview();

    expect(analyticsClient.requestAnalyticsOverview).toHaveBeenCalledWith(
      expect.objectContaining({
        counts: {
          rentals: 0,
          vehicles: 0,
          users: 0,
          mileageHistory: 0,
        },
      })
    );

    expect(result).toMatchObject({
      status: 'OK',
      phase: '13.F',
      source: 'python-analytics-service',
      insights: ['Dataset processed.'],
      metrics: {
        summary: {
          totalRentals: 0,
        },
      },
      pythonAnalyticsService: {
        status: 'available',
        phase: '13.E',
      },
    });
  });

  test('returns a safe fallback when the Python service is unavailable', async () => {
    const error = new Error('timeout');
    error.code = 'ANALYTICS_SERVICE_TIMEOUT';

    analyticsClient.requestAnalyticsOverview.mockRejectedValue(error);

    const result = await analyticsService.getAnalyticsOverview();

    expect(result).toMatchObject({
      status: 'DEGRADED',
      phase: '13.F',
      source: 'node-fallback',
      metrics: null,
      insights: [],
      pythonAnalyticsService: {
        status: 'unavailable',
        errorCode: 'ANALYTICS_SERVICE_TIMEOUT',
      },
    });

    expect(result.warnings).toEqual(['Analytics service request timed out.']);
  });

  test('does not call Python when the service URL is not configured', async () => {
    analyticsClient.getAnalyticsServiceConfig.mockReturnValue({
      configured: false,
      baseUrl: null,
      timeoutMs: 5000,
    });

    const result = await analyticsService.getAnalyticsOverview();

    expect(analyticsClient.requestAnalyticsOverview).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: 'DEGRADED',
      source: 'node-fallback',
      pythonAnalyticsService: {
        configured: false,
        status: 'not_configured',
        errorCode: 'ANALYTICS_SERVICE_NOT_CONFIGURED',
      },
    });
  });
});
