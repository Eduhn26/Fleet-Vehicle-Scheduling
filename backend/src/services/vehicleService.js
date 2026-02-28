const { Vehicle, VEHICLE_STATUS } = require('../models/Vehicle');

const createServiceError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const normalizeLicensePlate = (licensePlate) =>
  String(licensePlate || '').trim().toUpperCase();

const assertNonNegativeNumber = (value, fieldName) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw createServiceError(`${fieldName} deve ser um número`, 400);
  }
  if (value < 0) {
    throw createServiceError(`${fieldName} não pode ser negativo`, 400);
  }
};

const assertVehicleExists = (vehicle) => {
  if (!vehicle) throw createServiceError('Veículo não encontrado', 404);
};

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
  createdAt: vehicleDoc.createdAt,
  updatedAt: vehicleDoc.updatedAt,
});

const shouldEnterMaintenance = (mileage, nextMaintenance) => mileage >= nextMaintenance;

const findByLicensePlate = async (licensePlate) => {
  const plate = normalizeLicensePlate(licensePlate);
  if (!plate) throw createServiceError('Placa é obrigatória', 400);

  const vehicle = await Vehicle.findOne({ licensePlate: plate });
  assertVehicleExists(vehicle);

  return formatVehicle(vehicle);
};

const listVehicles = async () => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 });
  return vehicles.map(formatVehicle);
};

const createVehicle = async (input) => {
  const licensePlate = normalizeLicensePlate(input?.licensePlate);

  if (!licensePlate) throw createServiceError('Placa é obrigatória', 400);

  // NOTE: normalizamos a placa aqui para garantir consistência mesmo que alguém passe string “suja”.
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
  };

  if (!payload.brand) throw createServiceError('Marca é obrigatória', 400);
  if (!payload.model) throw createServiceError('Modelo é obrigatório', 400);
  if (!payload.color) throw createServiceError('Cor é obrigatória', 400);

  assertNonNegativeNumber(payload.mileage, 'mileage');
  assertNonNegativeNumber(payload.nextMaintenance, 'nextMaintenance');
  assertNonNegativeNumber(payload.lastMaintenanceMileage, 'lastMaintenanceMileage');

  if (payload.lastMaintenanceMileage > payload.mileage) {
    throw createServiceError('lastMaintenanceMileage não pode ser maior que mileage', 400);
  }

  // NOTE: se já nasce “vencido”, já entra em manutenção para não permitir agendamento indevido.
  if (shouldEnterMaintenance(payload.mileage, payload.nextMaintenance)) {
    payload.status = VEHICLE_STATUS.MAINTENANCE;
  }

  const exists = await Vehicle.findOne({ licensePlate });
  if (exists) throw createServiceError('Já existe um veículo com esta placa', 409);

  const created = await Vehicle.create(payload);
  return formatVehicle(created);
};

const updateMileage = async ({ licensePlate, mileage }) => {
  const plate = normalizeLicensePlate(licensePlate);
  if (!plate) throw createServiceError('Placa é obrigatória', 400);

  assertNonNegativeNumber(mileage, 'mileage');

  const vehicle = await Vehicle.findOne({ licensePlate: plate });
  assertVehicleExists(vehicle);

  // NOTE: reduzir KM é sinal de dado incorreto/rollback e bagunça regra de manutenção.
  if (mileage < vehicle.mileage) {
    throw createServiceError('mileage não pode diminuir', 400);
  }

  vehicle.mileage = mileage;

  // Regra de negócio: ao atingir nextMaintenance, entra em manutenção.
  if (shouldEnterMaintenance(vehicle.mileage, vehicle.nextMaintenance)) {
    vehicle.status = VEHICLE_STATUS.MAINTENANCE;
  }

  await vehicle.save();
  return formatVehicle(vehicle);
};

const setMaintenanceStatus = async ({ licensePlate, status }) => {
  const plate = normalizeLicensePlate(licensePlate);
  if (!plate) throw createServiceError('Placa é obrigatória', 400);

  const nextStatus = String(status || '').trim();
  const allowed = Object.values(VEHICLE_STATUS);
  if (!allowed.includes(nextStatus)) {
    throw createServiceError(`Status inválido. Use: ${allowed.join(', ')}`, 400);
  }

  const vehicle = await Vehicle.findOne({ licensePlate: plate });
  assertVehicleExists(vehicle);

  // NOTE: permitir forçar manutenção manualmente é requisito do sistema (admin override).
  vehicle.status = nextStatus;

  await vehicle.save();
  return formatVehicle(vehicle);
};

const recordMaintenance = async ({ licensePlate, newNextMaintenance }) => {
  const plate = normalizeLicensePlate(licensePlate);
  if (!plate) throw createServiceError('Placa é obrigatória', 400);

  assertNonNegativeNumber(newNextMaintenance, 'newNextMaintenance');

  const vehicle = await Vehicle.findOne({ licensePlate: plate });
  assertVehicleExists(vehicle);

  if (newNextMaintenance <= vehicle.mileage) {
    throw createServiceError('newNextMaintenance deve ser maior que a mileage atual', 400);
  }

  // NOTE: registrar manutenção “zera” o vencimento: atualiza base e define novo próximo marco.
  vehicle.lastMaintenanceMileage = vehicle.mileage;
  vehicle.nextMaintenance = newNextMaintenance;
  vehicle.status = VEHICLE_STATUS.AVAILABLE;

  await vehicle.save();
  return formatVehicle(vehicle);
};

module.exports = {
  createServiceError,
  normalizeLicensePlate,
  listVehicles,
  findByLicensePlate,
  createVehicle,
  updateMileage,
  setMaintenanceStatus,
  recordMaintenance,
};