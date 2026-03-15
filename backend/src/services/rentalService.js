const { RentalRequest, RENTAL_STATUS } = require('../models/RentalRequest');
const { Vehicle, VEHICLE_STATUS } = require('../models/Vehicle');
const { User } = require('../models/User');
const AppError = require('../utils/AppError');
const { VehicleMileageHistory } = require('../models/VehicleMileageHistory');

const fail = (message, statusCode) => {
  throw new AppError(message, statusCode);
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Business rule: reservations are intentionally capped
// to avoid long vehicle locks in the shared fleet.
const MAX_RENTAL_DAYS = 5;

/*
ENGINEERING NOTE:
Two date-to-string helpers exist for a reason.
toYyyyMmDd uses UTC to serialize dates stored in MongoDB (always UTC).
toLocalYyyyMmDd uses local time for "today" comparisons so a same-day
reservation is not rejected because of timezone offset.
*/
const toYyyyMmDd = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const toLocalYyyyMmDd = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const listApprovedPeriodsByVehicle = async ({ licensePlate }) => {
  const plate = String(licensePlate || '').trim().toUpperCase();
  if (!plate) fail('licensePlate é obrigatório', 400);

  const vehicle = await Vehicle.findOne({ licensePlate: plate });
  assertExists(vehicle, 'Veículo não encontrado');

  // Only approved reservations are treated as confirmed schedule blocks.
  // Pending requests must not lock vehicle availability.
  const rentals = await RentalRequest.find({
    vehicle: vehicle._id,
    status: RENTAL_STATUS.APPROVED,
  })
    .select('startDate endDate')
    .sort({ startDate: 1 });

  return rentals.map((r) => ({
    startDate: toYyyyMmDd(r.startDate),
    endDate: toYyyyMmDd(r.endDate),
  }));
};

const toUtcStartDate = (input) => {
  const ymd = toYyyyMmDd(input);
  if (!ymd) return null;
  return new Date(`${ymd}T00:00:00.000Z`);
};

const daysInclusiveUtc = (startUtc, endUtc) => {
  const start = toUtcStartDate(startUtc);
  const end = toUtcStartDate(endUtc);
  if (!start || !end) return null;

  const diff = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  return diff + 1;
};

const assertExists = (entity, notFoundMessage) => {
  if (!entity) fail(notFoundMessage, 404);
};

const assertObjectIdLike = (value, fieldName) => {
  const s = String(value || '').trim();
  if (!s) fail(`${fieldName} é obrigatório`, 400);
  return s;
};

const assertPurpose = (purpose) => {
  const p = String(purpose || '').trim();

  if (p.length < 3) fail('purpose inválido (mín. 3 caracteres)', 400);
  if (p.length > 300) fail('purpose inválido (máx. 300 caracteres)', 400);

  return p;
};

const normalizeNotes = (notes, fieldName = 'adminNotes') => {
  const value = String(notes || '').trim();

  if (value.length > 500) {
    fail(`${fieldName} inválido (máx. 500 caracteres)`, 400);
  }

  return value;
};

const normalizeMileage = (mileage) => {
  const value = Number(mileage);

  if (!Number.isFinite(value)) {
    fail('mileage inválido', 400);
  }

  if (value < 0) {
    fail('mileage inválido (não pode ser negativo)', 400);
  }

  return value;
};

const normalizePeriod = ({ startDate, endDate }) => {
  const startUtc = toUtcStartDate(startDate);
  const endUtc = toUtcStartDate(endDate);

  if (!startUtc) fail('startDate inválida', 400);
  if (!endUtc) fail('endDate inválida', 400);

  if (endUtc.getTime() < startUtc.getTime()) {
    fail('endDate não pode ser antes de startDate', 400);
  }

  const days = daysInclusiveUtc(startUtc, endUtc);
  if (!days) fail('Período inválido', 400);

  if (days > MAX_RENTAL_DAYS) {
    fail(`Período máximo é de ${MAX_RENTAL_DAYS} dias`, 400);
  }

  // Start date validation uses local calendar date instead of UTC.
  // This avoids rejecting same-day reservations because of timezone shifts.
  const today = toLocalYyyyMmDd(new Date());
  const start = String(startDate || '').trim();

  if (start < today) {
    fail('startDate não pode ser no passado', 400);
  }

  return { startUtc, endUtc, days };
};

/*
ENGINEERING NOTE:
formatRental handles both populated and unpopulated Mongoose documents.
Callers do not need to know whether populate() was used — the shape
returned is always consistent.
*/
const formatRental = (doc) => ({
  id: doc._id.toString(),

  user: doc.user?._id
    ? {
        id: doc.user._id.toString(),
        name: doc.user.name,
        email: doc.user.email,
      }
    : doc.user,

  vehicle: doc.vehicle?._id
    ? {
        id: doc.vehicle._id.toString(),
        brand: doc.vehicle.brand,
        model: doc.vehicle.model,
        licensePlate: doc.vehicle.licensePlate,
        mileage: doc.vehicle.mileage,
      }
    : doc.vehicle,

  startDate: toYyyyMmDd(doc.startDate),
  endDate: toYyyyMmDd(doc.endDate),
  purpose: doc.purpose,
  status: doc.status,
  adminNotes: doc.adminNotes,
  returnNotes: doc.returnNotes,
  returnRequestedMileage: doc.returnRequestedMileage,
  actualMileage: doc.actualMileage,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const createRequest = async ({ userId, vehicleId, startDate, endDate, purpose }) => {
  const uId = assertObjectIdLike(userId, 'userId');
  const vId = assertObjectIdLike(vehicleId, 'vehicleId');
  const p = assertPurpose(purpose);
  const { startUtc, endUtc } = normalizePeriod({ startDate, endDate });

  const user = await User.findById(uId);
  assertExists(user, 'Usuário não encontrado');

  const vehicle = await Vehicle.findById(vId);
  assertExists(vehicle, 'Veículo não encontrado');

  const created = await RentalRequest.create({
    user: uId,
    vehicle: vId,
    startDate: startUtc,
    endDate: endUtc,
    purpose: p,
    status: RENTAL_STATUS.PENDING,
  });

  return formatRental(created);
};

// Reservation lifecycle is protected explicitly.
// Invalid state jumps are rejected instead of being silently coerced.
const approveRequest = async ({ requestId, adminNotes }) => {
  const rId = assertObjectIdLike(requestId, 'requestId');
  const notes = normalizeNotes(adminNotes);

  const request = await RentalRequest.findById(rId);
  assertExists(request, 'Solicitação não encontrada');

  if (request.status !== RENTAL_STATUS.PENDING) {
    fail('Somente solicitações pendentes podem ser aprovadas', 409);
  }

  request.status = RENTAL_STATUS.APPROVED;
  request.adminNotes = notes;

  await request.save();
  return formatRental(request);
};

const rejectRequest = async ({ requestId, adminNotes }) => {
  const rId = assertObjectIdLike(requestId, 'requestId');
  const notes = normalizeNotes(adminNotes);

  const request = await RentalRequest.findById(rId);
  assertExists(request, 'Solicitação não encontrada');

  request.status = RENTAL_STATUS.REJECTED;
  request.adminNotes = notes;

  await request.save();
  return formatRental(request);
};

const cancelRequest = async ({ requestId, cancelNotes }) => {
  const rId = assertObjectIdLike(requestId, 'requestId');
  const notes = normalizeNotes(cancelNotes);

  const request = await RentalRequest.findById(rId);
  assertExists(request, 'Solicitação não encontrada');

  request.status = RENTAL_STATUS.CANCELLED;
  request.adminNotes = notes;

  await request.save();
  return formatRental(request);
};

/*
NOTE:
The user can report the vehicle return before the admin closes the flow.
RETURN_PENDING remains editable so the requested mileage can still be corrected.
*/
const requestReturn = async ({ requestId, userId, mileage, returnNotes }) => {
  const rId = assertObjectIdLike(requestId, 'requestId');
  const uId = assertObjectIdLike(userId, 'userId');
  const km = normalizeMileage(mileage);
  const notes = normalizeNotes(returnNotes, 'returnNotes');

  const request = await RentalRequest.findById(rId);
  assertExists(request, 'Solicitação não encontrada');

  if (request.user.toString() !== uId) {
    fail('Você não pode solicitar devolução desta reserva', 403);
  }

  if (
    request.status !== RENTAL_STATUS.APPROVED &&
    request.status !== RENTAL_STATUS.RETURN_PENDING
  ) {
    fail('Esta reserva não pode solicitar devolução', 409);
  }

  const vehicle = await Vehicle.findById(request.vehicle);
  assertExists(vehicle, 'Veículo não encontrado');

  if (km < vehicle.mileage) {
    fail(
      `KM informado (${km}) não pode ser menor que o atual do veículo (${vehicle.mileage})`,
      409
    );
  }

  request.status = RENTAL_STATUS.RETURN_PENDING;
  request.returnRequestedMileage = km;
  request.returnRequestedAt = new Date();
  request.returnNotes = notes;

  await request.save();
  return formatRental(request);
};

/*
NOTE:
The admin confirms the return in the final lifecycle step.
Only here the vehicle mileage and maintenance state become official.
*/
const completeRental = async ({ requestId, adminNotes }) => {
  const rId = assertObjectIdLike(requestId, 'requestId');
  const notes = normalizeNotes(adminNotes);

  const request = await RentalRequest.findById(rId);
  assertExists(request, 'Solicitação não encontrada');

  if (request.status !== RENTAL_STATUS.RETURN_PENDING) {
    fail('Reserva não está aguardando devolução', 409);
  }

  const vehicle = await Vehicle.findById(request.vehicle);
  assertExists(vehicle, 'Veículo não encontrado');

  const km = request.returnRequestedMileage;

  if (km < vehicle.mileage) {
    fail('KM informado não pode ser menor que o atual do veículo', 409);
  }

  const previousMileage = vehicle.mileage;

  vehicle.mileage = km;

  // Maintenance is triggered automatically when the confirmed
  // return mileage reaches the configured service threshold.
  if (vehicle.nextMaintenance && km >= vehicle.nextMaintenance) {
    vehicle.status = VEHICLE_STATUS.MAINTENANCE;
  }

  await vehicle.save();

  await VehicleMileageHistory.create({
    vehicle: vehicle._id,
    rental: request._id,
    previousMileage,
    newMileage: km,
  });

  request.status = RENTAL_STATUS.COMPLETED;
  request.actualMileage = km;
  request.completedAt = new Date();
  request.completionNotes = notes;

  await request.save();

  return formatRental(request);
};

const listRequests = async ({ status, userId } = {}) => {
  const query = {};

  if (status) query.status = status;
  if (userId) query.user = userId;

  const items = await RentalRequest.find(query)
    .populate('vehicle')
    .populate('user')
    .sort({ createdAt: -1 });

  return items.map(formatRental);
};

module.exports = {
  AppError,
  toUtcStartDate,
  daysInclusiveUtc,
  createRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
  requestReturn,
  completeRental,
  listRequests,
  listApprovedPeriodsByVehicle,
};