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

const getFallbackMessage = (errorCode) => {
  const messages = {
    ANALYTICS_SERVICE_NOT_CONFIGURED: 'Analytics service is not configured.',
    ANALYTICS_SERVICE_TIMEOUT: 'Analytics service request timed out.',
    ANALYTICS_SERVICE_HTTP_ERROR: 'Analytics service returned an invalid response.',
    ANALYTICS_SERVICE_UNAVAILABLE: 'Analytics service is unavailable.',
  };

  return messages[errorCode] || 'Analytics service could not process the dataset.';
};

const buildAnalyticsFallback = (dataset, clientConfig, errorCode) => ({
  status: 'DEGRADED',
  service: 'fleet-analytics-orchestrator',
  phase: '13.F',
  source: 'node-fallback',
  message: 'Analytics service unavailable. Returning a safe fallback.',
  generatedAt: dataset.generatedAt,
  receivedCounts: dataset.counts,
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
  nextStep: '13.G - Add the React analytics dashboard',
});

const getAnalyticsHealth = () => {
  const clientConfig = analyticsClient.getAnalyticsServiceConfig();

  return {
    status: 'OK',
    service: 'fleet-analytics-boundary',
    phase: '13.F',
    source: 'node-backend',
    message: 'Node analytics boundary is ready to call the Python service.',
    pythonAnalyticsService: {
      configured: clientConfig.configured,
      baseUrl: clientConfig.baseUrl,
      timeoutMs: clientConfig.timeoutMs,
      status: clientConfig.configured ? 'configured' : 'not_configured',
    },
    nextStep: '13.G - Add the React analytics dashboard',
  };
};

const getAnalyticsOverview = async () => {
  const dataset = await buildFleetAnalyticsDataset();
  const clientConfig = analyticsClient.getAnalyticsServiceConfig();

  if (!clientConfig.configured) {
    return buildAnalyticsFallback(
      dataset,
      clientConfig,
      'ANALYTICS_SERVICE_NOT_CONFIGURED'
    );
  }

  try {
    const analytics = await analyticsClient.requestAnalyticsOverview(dataset);

    return {
      status: analytics.status || 'OK',
      service: 'fleet-analytics-orchestrator',
      phase: '13.F',
      source: 'python-analytics-service',
      message: 'Node backend received fleet metrics from the Python analytics service.',
      generatedAt: dataset.generatedAt,
      receivedCounts: analytics.receivedCounts || dataset.counts,
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
      nextStep: '13.G - Add the React analytics dashboard',
    };
  } catch (error) {
    return buildAnalyticsFallback(
      dataset,
      clientConfig,
      error.code || 'ANALYTICS_SERVICE_UNAVAILABLE'
    );
  }
};

module.exports = {
  getAnalyticsHealth,
  getAnalyticsOverview,
  buildFleetAnalyticsDataset,
};
