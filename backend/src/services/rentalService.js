const { RentalRequest, RENTAL_STATUS } = require('../models/RentalRequest');
const { Vehicle, VEHICLE_STATUS } = require('../models/Vehicle');
const { User } = require('../models/User');
const AppError = require('../utils/AppError');

const fail = (message, statusCode) => {
  throw new AppError(message, statusCode);
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_RENTAL_DAYS = 5;

const toYyyyMmDd = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

  const todayUtc = toUtcStartDate(new Date());
  if (startUtc.getTime() < todayUtc.getTime()) {
    fail('startDate não pode ser no passado', 400);
  }

  return { startUtc, endUtc, days };
};

const formatRental = (doc) => ({
  id: doc._id.toString(),
  user: doc.user?.toString?.() ? doc.user.toString() : doc.user,
  vehicle: doc.vehicle?.toString?.() ? doc.vehicle.toString() : doc.vehicle,
  startDate: toYyyyMmDd(doc.startDate),
  endDate: toYyyyMmDd(doc.endDate),
  purpose: doc.purpose,
  status: doc.status,
  adminNotes: doc.adminNotes,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const assertVehicleAvailableForRequest = async (vehicleId) => {
  const vId = assertObjectIdLike(vehicleId, 'vehicleId');

  const vehicle = await Vehicle.findById(vId);
  assertExists(vehicle, 'Veículo não encontrado');

  if (vehicle.status === VEHICLE_STATUS.MAINTENANCE) {
    fail('Veículo em manutenção não pode ser alugado', 409);
  }

  return vehicle;
};

const findApprovedOverlap = async ({ vehicleId, startUtc, endUtc, excludeRequestId }) => {
  const query = {
    vehicle: vehicleId,
    status: RENTAL_STATUS.APPROVED,
    startDate: { $lte: endUtc },
    endDate: { $gte: startUtc },
  };

  if (excludeRequestId) query._id = { $ne: excludeRequestId };

  return RentalRequest.findOne(query);
};

const findDuplicateOpenRequest = async ({ userId, vehicleId, startUtc, endUtc }) =>
  RentalRequest.findOne({
    user: userId,
    vehicle: vehicleId,
    startDate: startUtc,
    endDate: endUtc,
    status: { $in: [RENTAL_STATUS.PENDING, RENTAL_STATUS.APPROVED] },
  });

const createRequest = async ({ userId, vehicleId, startDate, endDate, purpose }) => {
  const uId = assertObjectIdLike(userId, 'userId');
  const vId = assertObjectIdLike(vehicleId, 'vehicleId');
  const p = assertPurpose(purpose);
  const { startUtc, endUtc } = normalizePeriod({ startDate, endDate });

  const user = await User.findById(uId);
  assertExists(user, 'Usuário não encontrado');

  await assertVehicleAvailableForRequest(vId);

  const duplicate = await findDuplicateOpenRequest({ userId: uId, vehicleId: vId, startUtc, endUtc });
  if (duplicate) fail('Solicitação duplicada para o mesmo período', 409);

  const conflict = await findApprovedOverlap({ vehicleId: vId, startUtc, endUtc });
  if (conflict) fail('Conflito de datas: veículo já reservado nesse período', 409);

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

const adminCreateReservation = async ({ adminUserId, userId, vehicleId, startDate, endDate, purpose }) => {
  // NOTE: role/authorization fica no middleware/controller (Fase 3). Aqui é consistência de regra.
  assertObjectIdLike(adminUserId, 'adminUserId');
  return createRequest({ userId, vehicleId, startDate, endDate, purpose });
};

const approveRequest = async ({ requestId, adminNotes }) => {
  const rId = assertObjectIdLike(requestId, 'requestId');
  const notes = String(adminNotes || '').trim();

  const request = await RentalRequest.findById(rId);
  assertExists(request, 'Solicitação não encontrada');

  if (request.status === RENTAL_STATUS.REJECTED) {
    fail('Solicitação rejeitada não pode ser aprovada', 409);
  }

  if (request.status === RENTAL_STATUS.APPROVED) {
    return formatRental(request);
  }

  const vehicle = await assertVehicleAvailableForRequest(request.vehicle.toString());

  const startUtc = toUtcStartDate(request.startDate);
  const endUtc = toUtcStartDate(request.endDate);
  if (!startUtc || !endUtc) throw new Error('Período inválido armazenado na solicitação');

  const conflict = await findApprovedOverlap({
    vehicleId: vehicle._id.toString(),
    startUtc,
    endUtc,
    excludeRequestId: request._id.toString(),
  });

  if (conflict) fail('Conflito de datas: já existe reserva aprovada nesse período', 409);

  request.status = RENTAL_STATUS.APPROVED;
  request.adminNotes = notes;

  await request.save();
  return formatRental(request);
};

const rejectRequest = async ({ requestId, adminNotes }) => {
  const rId = assertObjectIdLike(requestId, 'requestId');
  const notes = String(adminNotes || '').trim();

  const request = await RentalRequest.findById(rId);
  assertExists(request, 'Solicitação não encontrada');

  if (request.status === RENTAL_STATUS.REJECTED) {
    return formatRental(request);
  }

  if (request.status === RENTAL_STATUS.APPROVED) {
    fail('Solicitação aprovada não pode ser rejeitada (requer cancelamento)', 409);
  }

  request.status = RENTAL_STATUS.REJECTED;
  request.adminNotes = notes;

  await request.save();
  return formatRental(request);
};

const listRequests = async ({ status } = {}) => {
  const query = {};
  if (status) query.status = String(status).trim();

  const items = await RentalRequest.find(query).sort({ createdAt: -1 });
  return items.map(formatRental);
};

module.exports = {
  AppError,
  toUtcStartDate,
  daysInclusiveUtc,
  createRequest,
  adminCreateReservation,
  approveRequest,
  rejectRequest,
  listRequests,
};