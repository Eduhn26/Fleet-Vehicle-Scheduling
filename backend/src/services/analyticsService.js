const analyticsClient = require('./analyticsClient');

const { RentalRequest } = require('../models/RentalRequest');
const { Vehicle } = require('../models/Vehicle');
const { User } = require('../models/User');
const { VehicleMileageHistory } = require('../models/VehicleMileageHistory');

const toId = (value) => {
  if (!value) return null;
  if (value._id) return value._id.toString();
  return value.toString();
};

const toIso = (value) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const roundNumber = (value, decimals = 2) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;

  const factor = 10 ** decimals;
  return Math.round(number * factor) / factor;
};

const calculateDurationHours = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (!start || !end) return 0;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;

  return roundNumber(diffMs / (60 * 60 * 1000), 2);
};

const calculateMaintenanceSnapshot = (vehicle) => {
  const mileage = toNumber(vehicle.mileage);
  const nextMaintenance = toNumber(vehicle.nextMaintenance);
  const lastMaintenanceMileage = toNumber(vehicle.lastMaintenanceMileage);

  const kmSinceLastMaintenance = Math.max(mileage - lastMaintenanceMileage, 0);
  const kmUntilMaintenance = Math.max(nextMaintenance - mileage, 0);

  const maintenanceProgressPercent =
    nextMaintenance > 0
      ? Math.min(roundNumber((mileage / nextMaintenance) * 100, 2), 100)
      : 0;

  return {
    kmSinceLastMaintenance,
    kmUntilMaintenance,
    maintenanceProgressPercent,
    isMaintenanceDue: nextMaintenance > 0 && mileage >= nextMaintenance,
  };
};

const buildUserMap = (users) =>
  new Map(users.map((user) => [toId(user), user]));

const buildVehicleMap = (vehicles) =>
  new Map(vehicles.map((vehicle) => [toId(vehicle), vehicle]));

const normalizeUser = (user) => ({
  id: toId(user),
  name: user.name || '',
  role: user.role || '',
  department: user.department || 'Não informado',
  registrationId: user.registrationId || '',
  createdAt: toIso(user.createdAt),
  updatedAt: toIso(user.updatedAt),
});

const normalizeVehicle = (vehicle) => {
  const maintenance = calculateMaintenanceSnapshot(vehicle);

  return {
    id: toId(vehicle),
    brand: vehicle.brand || '',
    model: vehicle.model || '',
    label: [vehicle.brand, vehicle.model].filter(Boolean).join(' '),
    year: vehicle.year || null,
    licensePlate: vehicle.licensePlate || '',
    color: vehicle.color || '',
    mileage: toNumber(vehicle.mileage),
    status: vehicle.status || '',
    transmissionType: vehicle.transmissionType || '',
    fuelType: vehicle.fuelType || '',
    passengers: toNumber(vehicle.passengers),
    nextMaintenance: toNumber(vehicle.nextMaintenance),
    lastMaintenanceMileage: toNumber(vehicle.lastMaintenanceMileage),
    imageUrl: vehicle.imageUrl || '',
    ...maintenance,
    createdAt: toIso(vehicle.createdAt),
    updatedAt: toIso(vehicle.updatedAt),
  };
};

const normalizeRental = (rental, userMap, vehicleMap) => {
  const userId = toId(rental.user);
  const vehicleId = toId(rental.vehicle);

  const user = userMap.get(userId);
  const vehicle = vehicleMap.get(vehicleId);

  return {
    id: toId(rental),
    userId,
    vehicleId,
    status: rental.status || '',
    purpose: rental.purpose || '',
    startDate: toIso(rental.startDate),
    endDate: toIso(rental.endDate),
    durationHours: calculateDurationHours(rental.startDate, rental.endDate),
    adminNotes: rental.adminNotes || '',
    returnRequestedMileage:
      rental.returnRequestedMileage === undefined
        ? null
        : toNumber(rental.returnRequestedMileage),
    returnRequestedAt: toIso(rental.returnRequestedAt),
    returnNotes: rental.returnNotes || '',
    actualMileage:
      rental.actualMileage === undefined ? null : toNumber(rental.actualMileage),
    completedAt: toIso(rental.completedAt),
    completionNotes: rental.completionNotes || '',
    user: user
      ? {
          id: toId(user),
          name: user.name || '',
          role: user.role || '',
          department: user.department || 'Não informado',
          registrationId: user.registrationId || '',
        }
      : null,
    vehicle: vehicle
      ? {
          id: toId(vehicle),
          label: [vehicle.brand, vehicle.model].filter(Boolean).join(' '),
          licensePlate: vehicle.licensePlate || '',
          status: vehicle.status || '',
        }
      : null,
    createdAt: toIso(rental.createdAt),
    updatedAt: toIso(rental.updatedAt),
  };
};

const normalizeMileageHistory = (record, vehicleMap) => {
  const vehicleId = toId(record.vehicle);
  const vehicle = vehicleMap.get(vehicleId);

  const previousMileage = toNumber(record.previousMileage);
  const newMileage = toNumber(record.newMileage);

  return {
    id: toId(record),
    vehicleId,
    rentalId: toId(record.rental),
    previousMileage,
    newMileage,
    mileageDelta: Math.max(newMileage - previousMileage, 0),
    recordedAt: toIso(record.recordedAt),
    vehicle: vehicle
      ? {
          id: toId(vehicle),
          label: [vehicle.brand, vehicle.model].filter(Boolean).join(' '),
          licensePlate: vehicle.licensePlate || '',
        }
      : null,
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
  };
};

const buildFleetAnalyticsDataset = async () => {
  const [rentals, vehicles, users, mileageHistory] = await Promise.all([
    RentalRequest.find().sort({ createdAt: -1 }).lean(),
    Vehicle.find().sort({ brand: 1, model: 1 }).lean(),
    User.find().select('-password -email').sort({ name: 1 }).lean(),
    VehicleMileageHistory.find().sort({ recordedAt: -1 }).lean(),
  ]);

  const userMap = buildUserMap(users);
  const vehicleMap = buildVehicleMap(vehicles);

  const normalizedUsers = users.map(normalizeUser);
  const normalizedVehicles = vehicles.map(normalizeVehicle);
  const normalizedRentals = rentals.map((rental) =>
    normalizeRental(rental, userMap, vehicleMap)
  );
  const normalizedMileageHistory = mileageHistory.map((record) =>
    normalizeMileageHistory(record, vehicleMap)
  );

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      rentals: normalizedRentals.length,
      vehicles: normalizedVehicles.length,
      users: normalizedUsers.length,
      mileageHistory: normalizedMileageHistory.length,
    },
    rentals: normalizedRentals,
    vehicles: normalizedVehicles,
    users: normalizedUsers,
    mileageHistory: normalizedMileageHistory,
  };
};
const ANALYTICS_STATUS_ORDER = [
  'pending',
  'approved',
  'return_pending',
  'completed',
  'rejected',
  'cancelled',
];

const normalizeOptionalText = (value) => {
  const normalized = String(value || '').trim();
  return normalized || null;
};

const normalizeDateFilter = (value) => {
  const normalized = normalizeOptionalText(value);
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;

  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10) === normalized ? normalized : null;
};

const normalizeAnalyticsFilters = (query = {}) => ({
  startDate: normalizeDateFilter(query.startDate),
  endDate: normalizeDateFilter(query.endDate),
  status: normalizeOptionalText(query.status),
  vehicleId: normalizeOptionalText(query.vehicleId),
  department: normalizeOptionalText(query.department),
});

const hasActiveFilters = (filters) => Object.values(filters).some(Boolean);

const toDateInput = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const buildFilterOptions = (dataset) => {
  const statuses = [...new Set(dataset.rentals.map((rental) => rental.status).filter(Boolean))]
    .sort((left, right) => {
      const leftIndex = ANALYTICS_STATUS_ORDER.indexOf(left);
      const rightIndex = ANALYTICS_STATUS_ORDER.indexOf(right);

      if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });

  const departments = [
    ...new Set(
      dataset.users
        .map((user) => user.department || 'Não informado')
        .filter(Boolean)
    ),
  ].sort((left, right) => left.localeCompare(right, 'pt-BR'));

  const vehicles = dataset.vehicles.map((vehicle) => ({
    id: vehicle.id,
    label: vehicle.label,
    licensePlate: vehicle.licensePlate,
  }));

  const rentalDates = dataset.rentals
    .map((rental) => toDateInput(rental.startDate))
    .filter(Boolean)
    .sort();

  return {
    statuses,
    departments,
    vehicles,
    dateBounds: {
      min: rentalDates[0] || null,
      max: rentalDates[rentalDates.length - 1] || null,
    },
  };
};

const isWithinDateRange = (value, startDate, endDate) => {
  if (!startDate && !endDate) return true;

  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return false;

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    if (date < start) return false;
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999Z`);
    if (date > end) return false;
  }

  return true;
};

const filterRentalsForFallback = (dataset, filters) =>
  dataset.rentals.filter((rental) => {
    if (!isWithinDateRange(rental.startDate, filters.startDate, filters.endDate)) {
      return false;
    }

    if (filters.status && rental.status !== filters.status) return false;
    if (filters.vehicleId && rental.vehicleId !== filters.vehicleId) return false;
    if (filters.department && rental.user?.department !== filters.department) {
      return false;
    }

    return true;
  });

const buildFallbackCounts = (dataset, filters) => {
  if (!hasActiveFilters(filters)) return dataset.counts;

  const rentals = filterRentalsForFallback(dataset, filters);
  const vehicleIds = new Set(rentals.map((rental) => rental.vehicleId).filter(Boolean));
  const userIds = new Set(rentals.map((rental) => rental.userId).filter(Boolean));
  const rentalIds = new Set(rentals.map((rental) => rental.id).filter(Boolean));

  const mileageHistory = dataset.mileageHistory.filter((record) => {
    if (!isWithinDateRange(record.recordedAt, filters.startDate, filters.endDate)) {
      return false;
    }

    if (filters.vehicleId && record.vehicleId !== filters.vehicleId) return false;

    if ((filters.status || filters.department) && !rentalIds.has(record.rentalId)) {
      return false;
    }

    return true;
  });

  return {
    rentals: rentals.length,
    vehicles: vehicleIds.size,
    users: userIds.size,
    mileageHistory: mileageHistory.length,
  };
};

const getFallbackMessage = (errorCode) => {
  const messages = {
    ANALYTICS_SERVICE_NOT_CONFIGURED: 'Serviço de analytics não configurado.',
    ANALYTICS_SERVICE_TIMEOUT: 'O serviço de analytics excedeu o tempo de resposta.',
    ANALYTICS_SERVICE_HTTP_ERROR: 'O serviço de analytics retornou uma resposta inválida.',
    ANALYTICS_SERVICE_UNAVAILABLE: 'Serviço de analytics indisponível.',
  };

  return messages[errorCode] || 'O serviço de analytics não processou os dados.';
};

const buildAnalyticsFallback = (
  dataset,
  filters,
  filterOptions,
  clientConfig,
  errorCode
) => ({
  status: 'DEGRADED',
  service: 'fleet-analytics-orchestrator',
  phase: '13.H',
  source: 'node-fallback',
  message: 'Analytics unavailable. Returning a filtered safe fallback.',
  generatedAt: dataset.generatedAt,
  sourceCounts: dataset.counts,
  receivedCounts: buildFallbackCounts(dataset, filters),
  appliedFilters: filters,
  filterOptions,
  warnings: [getFallbackMessage(errorCode)],
  insights: [],
  metrics: null,
  pythonAnalyticsService: {
    configured: clientConfig.configured,
    baseUrl: clientConfig.baseUrl,
    timeoutMs: clientConfig.timeoutMs,
    status: clientConfig.configured ? 'unavailable' : 'not_configured',
    errorCode,
  },
  nextStep: '13.I - Add Power BI-ready exports and analytical drill-downs',
});

const getAnalyticsHealth = () => {
  const clientConfig = analyticsClient.getAnalyticsServiceConfig();

  return {
    status: 'OK',
    service: 'fleet-analytics-boundary',
    phase: '13.H',
    source: 'node-backend',
    message: 'Node analytics boundary supports filtered Python analytics.',
    pythonAnalyticsService: {
      configured: clientConfig.configured,
      baseUrl: clientConfig.baseUrl,
      timeoutMs: clientConfig.timeoutMs,
      status: clientConfig.configured ? 'configured' : 'not_configured',
    },
    nextStep: '13.I - Add Power BI-ready exports and analytical drill-downs',
  };
};

const getAnalyticsOverview = async (query = {}) => {
  const dataset = await buildFleetAnalyticsDataset();
  const filters = normalizeAnalyticsFilters(query);
  const filterOptions = buildFilterOptions(dataset);
  const clientConfig = analyticsClient.getAnalyticsServiceConfig();

  if (!clientConfig.configured) {
    return buildAnalyticsFallback(
      dataset,
      filters,
      filterOptions,
      clientConfig,
      'ANALYTICS_SERVICE_NOT_CONFIGURED'
    );
  }

  try {
    const analytics = await analyticsClient.requestAnalyticsOverview(
      dataset,
      filters
    );

    return {
      status: analytics.status || 'OK',
      service: 'fleet-analytics-orchestrator',
      phase: '13.H',
      source: 'python-analytics-service',
      message: 'Node backend received filtered fleet metrics from Python.',
      generatedAt: dataset.generatedAt,
      sourceCounts: analytics.sourceCounts || dataset.counts,
      receivedCounts: analytics.receivedCounts || dataset.counts,
      appliedFilters: analytics.appliedFilters || filters,
      filterOptions,
      warnings: Array.isArray(analytics.warnings) ? analytics.warnings : [],
      insights: Array.isArray(analytics.insights) ? analytics.insights : [],
      metrics: analytics.metrics || null,
      pythonAnalyticsService: {
        configured: true,
        baseUrl: clientConfig.baseUrl,
        timeoutMs: clientConfig.timeoutMs,
        status: 'available',
        phase: analytics.phase || null,
      },
      nextStep: '13.I - Add Power BI-ready exports and analytical drill-downs',
    };
  } catch (error) {
    return buildAnalyticsFallback(
      dataset,
      filters,
      filterOptions,
      clientConfig,
      error.code || 'ANALYTICS_SERVICE_UNAVAILABLE'
    );
  }
};

module.exports = {
  getAnalyticsHealth,
  getAnalyticsOverview,
  buildFleetAnalyticsDataset,
  buildFilterOptions,
  normalizeAnalyticsFilters,
};
