const { Vehicle, VEHICLE_STATUS } = require('../models/Vehicle');
const AppError = require('../utils/AppError');

const fail = (message, statusCode) => {
  throw new AppError(message, statusCode);
};

const normalizeLicensePlate = (licensePlate) =>
  String(licensePlate || '').trim().toUpperCase();

const assertNonNegativeNumber = (value, fieldName) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    fail(`${fieldName} deve ser um número`, 400);
  }
  if (value < 0) {
    fail(`${fieldName} não pode ser negativo`, 400);
  }
};

const assertVehicleExists = (vehicle) => {
  if (!vehicle) fail('Veículo não encontrado', 404);
};

// NOTE: only serializable fields are returned — Mongoose document methods are stripped.
const formatVehicle = (vehicleDoc) => ({
  id: vehicleDoc._id.toString(),
  brand: vehicleDoc.brand,
  model: vehicleDoc.model,
  year: vehicleDoc.year,
  licensePlate: vehicleDoc.licensePlate,
  color: vehicleDoc.color,
  mileage: vehicleDoc.mileage,
  status: vehicleDoc.status,
  transmissionType: vehicleDoc.transmissionType,
  fuelType: vehicleDoc.fuelType,
  passengers: vehicleDoc.passengers,
  nextMaintenance: vehicleDoc.nextMaintenance,
  lastMaintenanceMileage: vehicleDoc.lastMaintenanceMileage,
  imageUrl: vehicleDoc.imageUrl || '',
  createdAt: vehicleDoc.createdAt,
  updatedAt: vehicleDoc.updatedAt,
});

// A vehicle enters maintenance as soon as it reaches
// or exceeds the configured maintenance threshold.
const shouldEnterMaintenance = (mileage, nextMaintenance) => mileage >= nextMaintenance;

const findByLicensePlate = async (licensePlate) => {
  const plate = normalizeLicensePlate(licensePlate);
  if (!plate) fail('Placa é obrigatória', 400);

  const vehicle = await Vehicle.findOne({ licensePlate: plate });
  assertVehicleExists(vehicle);

  return formatVehicle(vehicle);
};

const listVehicles = async () => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 });
  return vehicles.map(formatVehicle);
};

/*
ENGINEERING NOTE:
createVehicle enforces consistency at import time.
If a vehicle is seeded or imported with mileage already past the maintenance
threshold, its status is forced to MAINTENANCE rather than AVAILABLE.
This prevents a vehicle from entering the fleet in an operationally invalid state.
*/
const createVehicle = async (input) => {
  const licensePlate = normalizeLicensePlate(input?.licensePlate);
  if (!licensePlate) fail('Placa é obrigatória', 400);

  const payload = {
    brand: String(input?.brand || '').trim(),
    model: String(input?.model || '').trim(),
    year: input?.year,
    licensePlate,
    color: String(input?.color || '').trim(),
    mileage: input?.mileage ?? 0,
    status: input?.status ?? VEHICLE_STATUS.AVAILABLE,
    transmissionType: input?.transmissionType,
    fuelType: input?.fuelType,
    passengers: input?.passengers,
    nextMaintenance: input?.nextMaintenance,
    lastMaintenanceMileage: input?.lastMaintenanceMileage ?? 0,
    imageUrl: String(input?.imageUrl || '').trim(),
  };

  if (!payload.brand) fail('Marca é obrigatória', 400);
  if (!payload.model) fail('Modelo é obrigatório', 400);
  if (!payload.color) fail('Cor é obrigatória', 400);

  assertNonNegativeNumber(payload.mileage, 'mileage');
  assertNonNegativeNumber(payload.nextMaintenance, 'nextMaintenance');
  assertNonNegativeNumber(payload.lastMaintenanceMileage, 'lastMaintenanceMileage');

  if (payload.lastMaintenanceMileage > payload.mileage) {
    fail('lastMaintenanceMileage não pode ser maior que mileage', 400);
  }

  // Defensive consistency:
  // if imported or seeded mileage already crossed the threshold,
  // the vehicle must not start as available.
  if (shouldEnterMaintenance(payload.mileage, payload.nextMaintenance)) {
    payload.status = VEHICLE_STATUS.MAINTENANCE;
  }

  const exists = await Vehicle.findOne({ licensePlate });
  if (exists) fail('Já existe um veículo com esta placa', 409);

  const created = await Vehicle.create(payload);
  return formatVehicle(created);
};

const updateMileage = async ({ licensePlate, mileage }) => {
  const plate = normalizeLicensePlate(licensePlate);
  if (!plate) fail('Placa é obrigatória', 400);

  assertNonNegativeNumber(mileage, 'mileage');

  const vehicle = await Vehicle.findOne({ licensePlate: plate });
  assertVehicleExists(vehicle);

  // Mileage is monotonic in this domain.
  // Decreasing values would corrupt maintenance history.
  if (mileage < vehicle.mileage) {
    fail('mileage não pode diminuir', 400);
  }

  vehicle.mileage = mileage;

  if (shouldEnterMaintenance(vehicle.mileage, vehicle.nextMaintenance)) {
    vehicle.status = VEHICLE_STATUS.MAINTENANCE;
  }

  await vehicle.save();
  return formatVehicle(vehicle);
};

const deleteVehicle = async ({ licensePlate }) => {
  const plate = normalizeLicensePlate(licensePlate);
  if (!plate) fail('Placa é obrigatória', 400);

  const vehicle = await Vehicle.findOne({ licensePlate: plate });
  assertVehicleExists(vehicle);

  if (vehicle.status === 'rented') {
    fail('Não é possível excluir um veículo que está alugado', 409);
  }

  await Vehicle.deleteOne({ licensePlate: plate });

  return { deleted: true };
};

const setMaintenanceStatus = async ({ licensePlate, status }) => {
  const plate = normalizeLicensePlate(licensePlate);
  if (!plate) fail('Placa é obrigatória', 400);

  const nextStatus = String(status || '').trim();
  const allowed = Object.values(VEHICLE_STATUS);
  if (!allowed.includes(nextStatus)) {
    fail(`Status inválido. Use: ${allowed.join(', ')}`, 400);
  }

  const vehicle = await Vehicle.findOne({ licensePlate: plate });
  assertVehicleExists(vehicle);

  vehicle.status = nextStatus;

  await vehicle.save();
  return formatVehicle(vehicle);
};

/*
ENGINEERING NOTE:
recordMaintenance is the only operation that resets the maintenance cycle.
It snapshots the current mileage as the last serviced point, sets a new
threshold, and returns the vehicle to AVAILABLE status.
This is intentionally separate from setMaintenanceStatus to prevent
accidental resets via a generic status update.
*/
const recordMaintenance = async ({ licensePlate, newNextMaintenance }) => {
  const plate = normalizeLicensePlate(licensePlate);
  if (!plate) fail('Placa é obrigatória', 400);

  assertNonNegativeNumber(newNextMaintenance, 'newNextMaintenance');

  const vehicle = await Vehicle.findOne({ licensePlate: plate });
  assertVehicleExists(vehicle);

  if (newNextMaintenance <= vehicle.mileage) {
    fail('newNextMaintenance deve ser maior que a mileage atual', 400);
  }

  // Recording maintenance resets the operational checkpoint:
  // the current mileage becomes the last serviced mileage,
  // a new threshold is defined, and the vehicle returns to availability.
  vehicle.lastMaintenanceMileage = vehicle.mileage;
  vehicle.nextMaintenance = newNextMaintenance;
  vehicle.status = VEHICLE_STATUS.AVAILABLE;

  await vehicle.save();
  return formatVehicle(vehicle);
};

module.exports = {
  AppError,
  normalizeLicensePlate,
  listVehicles,
  findByLicensePlate,
  createVehicle,
  updateMileage,
  setMaintenanceStatus,
  recordMaintenance,
  deleteVehicle,
};