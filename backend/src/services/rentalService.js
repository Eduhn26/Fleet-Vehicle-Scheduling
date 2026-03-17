const { RentalRequest, RENTAL_STATUS } = require('../models/RentalRequest');
const { Vehicle, VEHICLE_STATUS } = require('../models/Vehicle');
const { User } = require('../models/User');
const AppError = require('../utils/AppError');
const { VehicleMileageHistory } = require('../models/VehicleMileageHistory');

const fail = (message, statusCode) => {
  throw new AppError(message, statusCode);
};

// ---------------------------------------------------------------------------
// DATETIME CONSTANTS
// ---------------------------------------------------------------------------

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

// Business rules
const MAX_RENTAL_HOURS = 12;  // single reservation cap
const MIN_RENTAL_MINUTES = 30; // minimum block size
const SLOT_MINUTES = 30;       // granularity enforced by the validator too

// ---------------------------------------------------------------------------
// DATETIME HELPERS
// ---------------------------------------------------------------------------

/*
ENGINEERING NOTE:
toIsoLocalDatetime serialises a UTC Date as "YYYY-MM-DDTHH:mm" in UTC.
This is what the API returns so the frontend can echo it back unchanged.

parseLocalDatetime parses "YYYY-MM-DDTHH:mm" treating it as UTC.
The frontend sends local wall-clock strings without a timezone suffix;
the server treats them as UTC so there is no implicit conversion on either end.
If the system ever needs to support explicit timezone-aware input, the contract
should change to ISO 8601 with offset (e.g. "2026-03-20T08:00-03:00").
*/

const toIsoLocalDatetime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

// Returns the UTC date string "YYYY-MM-DD" for calendar-day comparisons.
const toYyyyMmDd = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Parses "YYYY-MM-DDTHH:mm" as UTC. Returns null on invalid input.
const parseLocalDatetime = (input) => {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Accept both "YYYY-MM-DDTHH:mm" and "YYYY-MM-DDTHH:mm:ss"
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) return null;

  const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  const d = new Date(`${normalized}Z`); // force UTC interpretation

  return isNaN(d.getTime()) ? null : d;
};

const toLocalYyyyMmDd = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ---------------------------------------------------------------------------
// VALIDATION HELPERS
// ---------------------------------------------------------------------------

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
  if (value.length > 500) fail(`${fieldName} inválido (máx. 500 caracteres)`, 400);
  return value;
};

const normalizeMileage = (mileage) => {
  const value = Number(mileage);
  if (!Number.isFinite(value)) fail('mileage inválido', 400);
  if (value < 0) fail('mileage inválido (não pode ser negativo)', 400);
  return value;
};

/*
normalizePeriod validates and normalises the datetime period for a reservation.

Rules enforced here (business layer — validator handles format/slot alignment):
  1. Both datetimes must be parseable.
  2. endDate must be strictly after startDate.
  3. Minimum duration: MIN_RENTAL_MINUTES.
  4. Maximum duration: MAX_RENTAL_HOURS hours.
  5. startDate must not be in the past (compared against local wall clock).
*/
const normalizePeriod = ({ startDate, endDate }) => {
  const startUtc = parseLocalDatetime(startDate);
  const endUtc = parseLocalDatetime(endDate);

  if (!startUtc) fail('startDate inválida', 400);
  if (!endUtc) fail('endDate inválida', 400);

  if (endUtc.getTime() <= startUtc.getTime()) {
    fail('endDate deve ser posterior a startDate', 400);
  }

  const durationMs = endUtc.getTime() - startUtc.getTime();
  const durationMinutes = durationMs / MS_PER_MINUTE;
  const durationHours = durationMs / MS_PER_HOUR;

  if (durationMinutes < MIN_RENTAL_MINUTES) {
    fail(`Duração mínima é de ${MIN_RENTAL_MINUTES} minutos`, 400);
  }

  if (durationHours > MAX_RENTAL_HOURS) {
    fail(`Duração máxima por reserva é de ${MAX_RENTAL_HOURS} horas`, 400);
  }

  // Compare start against local wall clock (avoids UTC offset rejection for same-hour reservations)
  const nowLocalStr = toLocalYyyyMmDd(new Date());
  const startLocalStr = toLocalYyyyMmDd(startUtc);

  // Only reject if the start DATE is in the past (past times within today are allowed).
  // If stricter enforcement is needed, compare full datetime here.
  if (startLocalStr < nowLocalStr) {
    fail('startDate não pode ser no passado', 400);
  }

  return { startUtc, endUtc, durationMinutes };
};

// ---------------------------------------------------------------------------
// CONFLICT DETECTION
// ---------------------------------------------------------------------------

/*
ENGINEERING NOTE:
checkConflict detects overlapping approved reservations for the same vehicle.

Overlap condition (standard interval intersection):
  existingStart < newEnd  AND  existingEnd > newStart

Both strict inequalities mean that back-to-back reservations
(08:00–12:00 and 12:00–17:00) do NOT conflict — the vehicle is
available for the next user exactly at 12:00.

The query excludes the current request (currentRequestId) so that
editing an existing approved reservation does not self-conflict.
*/
const checkConflict = async ({ vehicleId, startUtc, endUtc, excludeRequestId = null }) => {
  const query = {
    vehicle: vehicleId,
    status: RENTAL_STATUS.APPROVED,
    startDate: { $lt: endUtc },
    endDate: { $gt: startUtc },
  };

  if (excludeRequestId) {
    query._id = { $ne: excludeRequestId };
  }

  const conflict = await RentalRequest.findOne(query).populate('user', 'name email');
  return conflict || null;
};

// ---------------------------------------------------------------------------
// RESPONSE FORMATTER
// ---------------------------------------------------------------------------

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

  // Return full datetime strings (YYYY-MM-DDTHH:mm) for hour-aware clients.
  // Also return the legacy date-only fields so older API consumers still work.
  startDate: toIsoLocalDatetime(doc.startDate),
  endDate: toIsoLocalDatetime(doc.endDate),
  startDateOnly: toYyyyMmDd(doc.startDate),
  endDateOnly: toYyyyMmDd(doc.endDate),

  purpose: doc.purpose,
  status: doc.status,
  adminNotes: doc.adminNotes,
  returnNotes: doc.returnNotes,
  returnRequestedMileage: doc.returnRequestedMileage,
  actualMileage: doc.actualMileage,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// ---------------------------------------------------------------------------
// AVAILABILITY LISTING (used by the calendar frontend)
// ---------------------------------------------------------------------------

/*
listApprovedPeriodsByVehicle returns the approved reservations for a vehicle
so the frontend can render blocked slots on the calendar.

Each item now includes full datetime strings so the UI can shade individual
hour slots rather than entire days.
*/
const listApprovedPeriodsByVehicle = async ({ licensePlate }) => {
  const plate = String(licensePlate || '').trim().toUpperCase();
  if (!plate) fail('licensePlate é obrigatório', 400);

  const vehicle = await Vehicle.findOne({ licensePlate: plate });
  assertExists(vehicle, 'Veículo não encontrado');

  const rentals = await RentalRequest.find({
    vehicle: vehicle._id,
    status: RENTAL_STATUS.APPROVED,
  })
    .select('startDate endDate')
    .sort({ startDate: 1 });

  return rentals.map((r) => ({
    // Full datetime for hour-level blocking
    startDate: toIsoLocalDatetime(r.startDate),
    endDate: toIsoLocalDatetime(r.endDate),
    // Date-only fields kept for backward compatibility
    startDateOnly: toYyyyMmDd(r.startDate),
    endDateOnly: toYyyyMmDd(r.endDate),
  }));
};

// ---------------------------------------------------------------------------
// CRUD OPERATIONS
// ---------------------------------------------------------------------------

const createRequest = async ({ userId, vehicleId, startDate, endDate, purpose }) => {
  const uId = assertObjectIdLike(userId, 'userId');
  const vId = assertObjectIdLike(vehicleId, 'vehicleId');
  const p = assertPurpose(purpose);
  const { startUtc, endUtc } = normalizePeriod({ startDate, endDate });

  const user = await User.findById(uId);
  assertExists(user, 'Usuário não encontrado');

  const vehicle = await Vehicle.findById(vId);
  assertExists(vehicle, 'Veículo não encontrado');

  // Check for overlap with any existing approved reservation.
  const conflict = await checkConflict({ vehicleId: vId, startUtc, endUtc });

  if (conflict) {
    const who = conflict.user?.name ?? 'outro usuário';
    const cs = toIsoLocalDatetime(conflict.startDate);
    const ce = toIsoLocalDatetime(conflict.endDate);
    fail(`Conflito: veículo já reservado por ${who} de ${cs} até ${ce}`, 409);
  }

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

const approveRequest = async ({ requestId, adminNotes }) => {
  const rId = assertObjectIdLike(requestId, 'requestId');
  const notes = normalizeNotes(adminNotes);

  const request = await RentalRequest.findById(rId);
  assertExists(request, 'Solicitação não encontrada');

  if (request.status !== RENTAL_STATUS.PENDING) {
    fail('Somente solicitações pendentes podem ser aprovadas', 409);
  }

  // Re-check conflict at approval time — another request may have been
  // approved in the interval between submission and admin review.
  const conflict = await checkConflict({
    vehicleId: request.vehicle,
    startUtc: request.startDate,
    endUtc: request.endDate,
    excludeRequestId: request._id,
  });

  if (conflict) {
    const who = conflict.user?.name ?? 'outro usuário';
    const cs = toIsoLocalDatetime(conflict.startDate);
    const ce = toIsoLocalDatetime(conflict.endDate);
    fail(`Conflito: veículo já reservado por ${who} de ${cs} até ${ce}`, 409);
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
  parseLocalDatetime,
  toIsoLocalDatetime,
  toYyyyMmDd,
  checkConflict,
  createRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
  requestReturn,
  completeRental,
  listRequests,
  listApprovedPeriodsByVehicle,
};