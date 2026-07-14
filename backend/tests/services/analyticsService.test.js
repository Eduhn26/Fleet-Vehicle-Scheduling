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

const setDataset = ({ rentals = [], vehicles = [], users = [], mileage = [] }) => {
  RentalRequest.find.mockReturnValue(sortAndLean(rentals));
  Vehicle.find.mockReturnValue(sortAndLean(vehicles));
  User.find.mockReturnValue(selectSortAndLean(users));
  VehicleMileageHistory.find.mockReturnValue(sortAndLean(mileage));
};

describe('analyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    setDataset({});

    analyticsClient.getAnalyticsServiceConfig.mockReturnValue({
      configured: true,
      baseUrl: 'http://localhost:8000',
      timeoutMs: 5000,
    });
  });

  test('normalizes supported analytics filters', () => {
    expect(
      analyticsService.normalizeAnalyticsFilters({
        startDate: '2026-01-01',
        endDate: 'invalid',
        status: ' approved ',
        vehicleId: '',
        department: ' Operações ',
      })
    ).toEqual({
      startDate: '2026-01-01',
      endDate: null,
      status: 'approved',
      vehicleId: null,
      department: 'Operações',
    });
  });

  test('returns filtered Python metrics through the Node boundary', async () => {
    analyticsClient.requestAnalyticsOverview.mockResolvedValue({
      status: 'OK',
      phase: '13.H',
      sourceCounts: {
        rentals: 39,
        vehicles: 6,
        users: 12,
        mileageHistory: 5,
      },
      receivedCounts: {
        rentals: 8,
        vehicles: 3,
        users: 4,
        mileageHistory: 2,
      },
      appliedFilters: {
        startDate: '2026-01-01',
        endDate: null,
        status: 'approved',
        vehicleId: null,
        department: null,
      },
      warnings: [],
      insights: ['Filtered dataset processed.'],
      metrics: {
        summary: {
          totalRentals: 8,
        },
        rentalTrend: [],
      },
    });

    const result = await analyticsService.getAnalyticsOverview({
      startDate: '2026-01-01',
      status: 'approved',
    });

    expect(analyticsClient.requestAnalyticsOverview).toHaveBeenCalledWith(
      expect.objectContaining({
        counts: {
          rentals: 0,
          vehicles: 0,
          users: 0,
          mileageHistory: 0,
        },
      }),
      {
        startDate: '2026-01-01',
        endDate: null,
        status: 'approved',
        vehicleId: null,
        department: null,
      }
    );

    expect(result).toMatchObject({
      status: 'OK',
      phase: '13.H',
      source: 'python-analytics-service',
      receivedCounts: {
        rentals: 8,
      },
      insights: ['Filtered dataset processed.'],
      metrics: {
        summary: {
          totalRentals: 8,
        },
      },
      pythonAnalyticsService: {
        status: 'available',
        phase: '13.H',
      },
    });
  });

  test('builds filter options from the full normalized dataset', async () => {
    setDataset({
      rentals: [
        {
          _id: 'rental-1',
          user: 'user-1',
          vehicle: 'vehicle-1',
          status: 'approved',
          startDate: new Date('2026-02-10T10:00:00.000Z'),
        },
      ],
      vehicles: [
        {
          _id: 'vehicle-1',
          brand: 'Toyota',
          model: 'Yaris',
          licensePlate: 'YAR-1234',
        },
      ],
      users: [
        {
          _id: 'user-1',
          name: 'Eduardo',
          department: 'Operações',
        },
      ],
    });

    analyticsClient.requestAnalyticsOverview.mockResolvedValue({
      status: 'OK',
      phase: '13.H',
      warnings: [],
      insights: [],
      metrics: {},
    });

    const result = await analyticsService.getAnalyticsOverview();

    expect(result.filterOptions).toEqual({
      statuses: ['approved'],
      departments: ['Operações'],
      vehicles: [
        {
          id: 'vehicle-1',
          label: 'Toyota Yaris',
          licensePlate: 'YAR-1234',
        },
      ],
      dateBounds: {
        min: '2026-02-10',
        max: '2026-02-10',
      },
    });
  });

  test('returns filtered counts in fallback mode', async () => {
    setDataset({
      rentals: [
        {
          _id: 'rental-1',
          user: 'user-1',
          vehicle: 'vehicle-1',
          status: 'approved',
          startDate: new Date('2026-02-10T10:00:00.000Z'),
        },
        {
          _id: 'rental-2',
          user: 'user-2',
          vehicle: 'vehicle-2',
          status: 'completed',
          startDate: new Date('2026-03-10T10:00:00.000Z'),
        },
      ],
      vehicles: [
        { _id: 'vehicle-1', brand: 'Toyota', model: 'Yaris' },
        { _id: 'vehicle-2', brand: 'Fiat', model: 'Argo' },
      ],
      users: [
        { _id: 'user-1', name: 'A', department: 'Operações' },
        { _id: 'user-2', name: 'B', department: 'Financeiro' },
      ],
    });

    const error = new Error('timeout');
    error.code = 'ANALYTICS_SERVICE_TIMEOUT';
    analyticsClient.requestAnalyticsOverview.mockRejectedValue(error);

    const result = await analyticsService.getAnalyticsOverview({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      status: 'approved',
    });

    expect(result).toMatchObject({
      status: 'DEGRADED',
      phase: '13.H',
      source: 'node-fallback',
      receivedCounts: {
        rentals: 1,
        vehicles: 1,
        users: 1,
        mileageHistory: 0,
      },
      appliedFilters: {
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        status: 'approved',
      },
      metrics: null,
      pythonAnalyticsService: {
        status: 'unavailable',
        errorCode: 'ANALYTICS_SERVICE_TIMEOUT',
      },
    });

    expect(result.warnings).toEqual([
      'O serviço de analytics excedeu o tempo de resposta.',
    ]);
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
