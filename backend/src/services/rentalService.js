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

  // NOTE: a fase usa YYYY-MM-DD como contrato canônico para matar drift de timezone.
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

  // NOTE: "hoje" precisa respeitar o dia local da operação.
  // Usar UTC aqui faz o Brasil "virar o dia" antes da meia-noite local.
  const today = toLocalYyyyMmDd(new Date());
  const start = String(startDate || '').trim();

  if (start < today) {
    fail('startDate não pode ser no passado', 400);
  }

  return { startUtc, endUtc, days };
};

const formatRental = (doc) => ({
  id: doc._id.toString(),
  user: doc.user?._id
    ? {
        id: doc.user._id.toString(),
        name: doc.user.name,
        email: doc.user.email,
        role: doc.user.role,
      }
    : doc.user?.toString?.()
      ? doc.user.toString()
      : doc.user,
  vehicle: doc.vehicle?._id
    ? {
        id: doc.vehicle._id.toString(),
        brand: doc.vehicle.brand,
        model: doc.vehicle.model,
        licensePlate: doc.vehicle.licensePlate,
        status: doc.vehicle.status,
      }
    : doc.vehicle?.toString?.()
      ? doc.vehicle.toString()
      : doc.vehicle,
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

  // NOTE: maintenance é bloqueio operacional explícito, independente de calendário.
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

  if (excludeRequestId) {
    // NOTE: approve precisa ignorar a própria request para não gerar falso positivo.
    query._id = { $ne: excludeRequestId };
  }

  return RentalRequest.findOne(query);
};

const findDuplicateOpenRequest = async ({ userId, vehicleId, startUtc, endUtc }) =>
  RentalRequest.findOne({
    user: userId,
    vehicle: vehicleId,
    startDate: startUtc,
    endDate: endUtc,
    status: {
      // NOTE: pending e approved continuam “abertas” do ponto de vista operacional.
      $in: [RENTAL_STATUS.PENDING, RENTAL_STATUS.APPROVED],
    },
  });

const createRequest = async ({ userId, vehicleId, startDate, endDate, purpose }) => {
  const uId = assertObjectIdLike(userId, 'userId');
  const vId = assertObjectIdLike(vehicleId, 'vehicleId');
  const p = assertPurpose(purpose);
  const { startUtc, endUtc } = normalizePeriod({ startDate, endDate });

  const user = await User.findById(uId);
  assertExists(user, 'Usuário não encontrado');

  await assertVehicleAvailableForRequest(vId);

  const duplicate = await findDuplicateOpenRequest({
    userId: uId,
    vehicleId: vId,
    startUtc,
    endUtc,
  });

  if (duplicate) {
    fail('Solicitação duplicada para o mesmo período', 409);
  }

  const conflict = await findApprovedOverlap({
    vehicleId: vId,
    startUtc,
    endUtc,
  });

  // NOTE: só approved bloqueia agenda real. Pending ainda não “consome” o veículo.
  if (conflict) {
    fail('Conflito de datas: veículo já reservado nesse período', 409);
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

const adminCreateReservation = async ({
  adminUserId,
  userId,
  vehicleId,
  startDate,
  endDate,
  purpose,
}) => {
  // SEC: ainda validamos a presença do adminUserId para não deixar o fluxo “sem ator”.
  assertObjectIdLike(adminUserId, 'adminUserId');

  return createRequest({ userId, vehicleId, startDate, endDate, purpose });
};

const approveRequest = async ({ requestId, adminNotes }) => {
  const rId = assertObjectIdLike(requestId, 'requestId');
  const notes = normalizeNotes(adminNotes, 'adminNotes');

  const request = await RentalRequest.findById(rId);
  assertExists(request, 'Solicitação não encontrada');

  if (request.status === RENTAL_STATUS.APPROVED) {
    fail('Solicitação já foi aprovada', 409);
  }

  // NOTE: rejected é decisão final; reabrir isso por approve direto distorce o workflow.
  if (request.status === RENTAL_STATUS.REJECTED) {
    fail('Solicitação rejeitada não pode ser aprovada', 409);
  }

  // NOTE: cancelled representa encerramento do fluxo pelo ator autorizado.
  if (request.status === RENTAL_STATUS.CANCELLED) {
    fail('Solicitação cancelada não pode ser aprovada', 409);
  }

  const vehicle = await assertVehicleAvailableForRequest(request.vehicle.toString());

  const startUtc = toUtcStartDate(request.startDate);
  const endUtc = toUtcStartDate(request.endDate);

  // FIXME: se isso disparar, temos dado persistido inconsistente no banco.
  if (!startUtc || !endUtc) {
    throw new Error('Período inválido armazenado na solicitação');
  }

  const conflict = await findApprovedOverlap({
    vehicleId: vehicle._id.toString(),
    startUtc,
    endUtc,
    excludeRequestId: request._id.toString(),
  });

  // NOTE: revalidamos no approve porque duas requests pending podem coexistir até a decisão final.
  if (conflict) {
    fail('Conflito de datas: já existe reserva aprovada nesse período', 409);
  }

  request.status = RENTAL_STATUS.APPROVED;
  request.adminNotes = notes;

  await request.save();
  return formatRental(request);
};

const rejectRequest = async ({ requestId, adminNotes }) => {
  const rId = assertObjectIdLike(requestId, 'requestId');
  const notes = normalizeNotes(adminNotes, 'adminNotes');

  const request = await RentalRequest.findById(rId);
  assertExists(request, 'Solicitação não encontrada');

  if (request.status === RENTAL_STATUS.REJECTED) {
    fail('Solicitação já foi rejeitada', 409);
  }

  // NOTE: depois de aprovada, a saída semântica correta é cancelamento, não rejeição retroativa.
  if (request.status === RENTAL_STATUS.APPROVED) {
    fail('Solicitação aprovada não pode ser rejeitada (requer cancelamento)', 409);
  }

  if (request.status === RENTAL_STATUS.CANCELLED) {
    fail('Solicitação cancelada não pode ser rejeitada', 409);
  }

  request.status = RENTAL_STATUS.REJECTED;
  request.adminNotes = notes;

  await request.save();
  return formatRental(request);
};

const cancelRequest = async ({ requestId, actorUserId, actorRole, cancelNotes }) => {
  const rId = assertObjectIdLike(requestId, 'requestId');
  const aId = assertObjectIdLike(actorUserId, 'actorUserId');
  const role = String(actorRole || '').trim();
  const notes = normalizeNotes(cancelNotes, 'cancelNotes');

  const request = await RentalRequest.findById(rId);
  assertExists(request, 'Solicitação não encontrada');

  const isAdmin = role === 'admin';
  const isOwner = request.user.toString() === aId;

  // SEC: cancelamento é sensível porque altera disponibilidade operacional da frota.
  if (!isAdmin && !isOwner) {
    fail('Você não tem permissão para cancelar esta solicitação', 403);
  }

  // NOTE: rejected já encerra o fluxo administrativo; cancelar depois apagaria a semântica da decisão.
  if (request.status === RENTAL_STATUS.REJECTED) {
    fail('Solicitação rejeitada não pode ser cancelada', 409);
  }

  // NOTE: guard explícito para manter comportamento previsível em retry duplo de UI.
  if (request.status === RENTAL_STATUS.CANCELLED) {
    fail('Solicitação já foi cancelada', 409);
  }

  request.status = RENTAL_STATUS.CANCELLED;

  // NOTE: reaproveitamos adminNotes para não expandir schema cedo demais nesta fase.
  // TODO: separar trilha de auditoria por ação quando o sistema ganhar histórico formal.
  request.adminNotes = notes;

  await request.save();
  return formatRental(request);
};

const listRequests = async ({ status, userId } = {}) => {
  const query = {};

  if (status) {
    query.status = String(status).trim();
  }

  if (userId) {
    query.user = String(userId).trim();
  }

  const items = await RentalRequest.find(query)
    .populate('vehicle', 'brand model licensePlate status')
    .populate('user', 'name email role')
    .sort({ createdAt: -1 });

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
  cancelRequest,
  listRequests,
  listApprovedPeriodsByVehicle, 
};