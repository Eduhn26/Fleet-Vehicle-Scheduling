require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDatabase = require('../src/config/database');

const BCRYPT_SALT_ROUNDS = 10;
const DEMO_PASSWORD = '123456';
const DEMO_TAG = '[DEMO-SEED]';

/*
ENGINEERING NOTE:
This script generates a lightweight demo dataset used for local testing
and UI exploration. It performs idempotent user upserts and generates
synthetic rental requests using randomized time windows and status
distribution.

The implementation uses schema introspection to remain resilient to
model evolution. Fields are only populated if they exist in the
current schema definition.
*/

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/*
NOTE:
Some model modules export the model directly while others export
an object containing the model. This helper resolves both patterns.
*/
function loadModel(modulePath, directName) {
  const exported = require(modulePath);

  if (exported && exported.schema && exported.modelName) {
    return exported;
  }

  if (exported && exported[directName] && exported[directName].schema) {
    return exported[directName];
  }

  const values = Object.values(exported || {});
  const model = values.find((value) => value && value.schema && value.modelName);

  if (!model) {
    throw new Error(`Unable to resolve model in ${modulePath}`);
  }

  return model;
}

/*
NOTE:
Helpers below inspect schema paths dynamically so this seed does not
break if field names evolve across versions of the model.
*/
function hasPath(model, pathName) {
  return Boolean(model.schema.path(pathName));
}

function firstExistingPath(model, candidates) {
  return candidates.find((candidate) => hasPath(model, candidate)) || null;
}

function setIfExists(target, model, candidates, value) {
  const pathName = firstExistingPath(model, candidates);

  if (pathName) {
    target[pathName] = value;
  }
}

function getEnumValues(model, pathName) {
  const path = model.schema.path(pathName);

  if (!path || !Array.isArray(path.enumValues)) {
    return [];
  }

  return path.enumValues.filter(Boolean);
}

/*
ENGINEERING NOTE:
Builds a deterministic distribution of rental statuses so the UI
can showcase multiple lifecycle states (pending, approved, in-use,
return-requested, completed, cancelled).
*/
function resolveStatusPlan(availableStatuses) {
  const normalized = new Map(
    availableStatuses.map((status) => [String(status).toLowerCase(), status])
  );

  const plan = [];

  const pushMany = (aliases, count) => {
    const found = aliases.map((alias) => normalized.get(alias)).find(Boolean);

    if (!found) {
      return;
    }

    for (let index = 0; index < count; index += 1) {
      plan.push(found);
    }
  };

  pushMany(['pending'], 4);
  pushMany(['approved'], 5);
  pushMany(['in_use', 'in-use', 'inuse'], 3);
  pushMany(['return_requested', 'return-requested', 'returnrequested'], 4);
  pushMany(['completed'], 10);
  pushMany(['cancelled', 'canceled'], 4);

  return plan;
}

/*
NOTE:
Creates a normalized payload for users while ensuring optional
fields remain compatible with different schema versions.
*/
function buildUserPayload(base, passwordHash, USER_ROLE) {
  const payload = {
    name: base.name,
    email: base.email,
    password: passwordHash,
    role: base.role,
  };

  if (base.department) {
    payload.department = base.department;
  }

  if (base.registrationId) {
    payload.registrationId = base.registrationId;
  }

  if (base.role === USER_ROLE.ADMIN && !base.department) {
    payload.department = 'Gestão';
  }

  if (base.role === USER_ROLE.USER && !base.department) {
    payload.department = 'Operações';
  }

  return payload;
}

/*
ENGINEERING NOTE:
Constructs a rental payload while adapting to schema differences
across project versions (field name variations, optional metadata).
*/
function buildRequestPayload({
  RentalRequest,
  userId,
  vehicleId,
  status,
  startDate,
  endDate,
  reason,
  approvedBy,
  createdAt,
  updatedAt,
}) {
  const payload = {};

  setIfExists(payload, RentalRequest, ['user', 'requestedBy', 'requester', 'userId'], userId);
  setIfExists(payload, RentalRequest, ['vehicle', 'vehicleId'], vehicleId);

  setIfExists(payload, RentalRequest, ['startDate', 'pickupDate', 'fromDate'], startDate);
  setIfExists(payload, RentalRequest, ['endDate', 'returnDate', 'toDate'], endDate);

  setIfExists(payload, RentalRequest, ['reason', 'purpose', 'notes'], reason);
  setIfExists(payload, RentalRequest, ['status'], status);

  setIfExists(
    payload,
    RentalRequest,
    ['approvedBy', 'reviewedBy', 'processedBy', 'handledBy'],
    approvedBy
  );

  setIfExists(
    payload,
    RentalRequest,
    ['requestedAt', 'submittedAt', 'createdAt'],
    createdAt
  );

  setIfExists(
    payload,
    RentalRequest,
    ['updatedAt', 'processedAt', 'approvedAt'],
    updatedAt
  );

  setIfExists(
    payload,
    RentalRequest,
    ['demo', 'isDemo'],
    true
  );

  if (hasPath(RentalRequest, 'reason') && !payload.reason) {
    payload.reason = reason;
  }

  if (hasPath(RentalRequest, 'status') && !payload.status) {
    payload.status = status;
  }

  return payload;
}

async function closeConnectionSafely() {
  try {
    await mongoose.connection.close();
  } catch (_) {}
}

/*
ENGINEERING NOTE:
Main execution entrypoint.
Creates demo users (idempotent upsert) and generates synthetic
rental requests covering multiple lifecycle states.
*/
async function run() {
  let User;
  let Vehicle;
  let RentalRequest;
  let USER_ROLE;

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await connectDatabase();

    const userModule = require('../src/models/User');
    User = userModule.User || userModule;
    USER_ROLE = userModule.USER_ROLE || { ADMIN: 'admin', USER: 'user' };

    Vehicle = loadModel('../src/models/Vehicle', 'Vehicle');
    RentalRequest = loadModel('../src/models/RentalRequest', 'RentalRequest');

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_SALT_ROUNDS);

    const usersSeed = [
      {
        name: 'Eduardo Henrique',
        email: 'eduardo@fleet.com',
        role: USER_ROLE.ADMIN,
        department: 'Gestão',
        registrationId: 'ADM001',
      },
    
      {
        name: 'Mariana Lopes',
        email: 'mariana@fleet.com',
        role: USER_ROLE.ADMIN,
        department: 'Gestão',
        registrationId: 'ADM002',
      },
      {
        name: 'João Silva',
        email: 'joao.silva@empresa.com',
        role: USER_ROLE.USER,
        department: 'Operações',
        registrationId: 'USER001',
      },
      {
        name: 'Maria Souza',
        email: 'maria.souza@empresa.com',
        role: USER_ROLE.USER,
        department: 'Comercial',
        registrationId: 'USER002',
      },
      {
        name: 'Carlos Pereira',
        email: 'carlos.pereira@empresa.com',
        role: USER_ROLE.USER,
        department: 'Suporte Técnico',
        registrationId: 'USER003',
      },
      {
        name: 'Ana Lima',
        email: 'ana.lima@empresa.com',
        role: USER_ROLE.USER,
        department: 'Financeiro',
        registrationId: 'USER004',
      },
      {
        name: 'Felipe Rocha',
        email: 'felipe.rocha@empresa.com',
        role: USER_ROLE.USER,
        department: 'Operações',
        registrationId: 'USER005',
      },
      {
        name: 'Juliana Martins',
        email: 'juliana.martins@empresa.com',
        role: USER_ROLE.USER,
        department: 'Jurídico',
        registrationId: 'USER006',
      },
      {
        name: 'Roberto Alves',
        email: 'roberto.alves@empresa.com',
        role: USER_ROLE.USER,
        department: 'Infraestrutura',
        registrationId: 'USER007',
      },
      {
        name: 'Camila Costa',
        email: 'camila.costa@empresa.com',
        role: USER_ROLE.USER,
        department: 'RH',
        registrationId: 'USER008',
      },
    ];

    const upsertedUsers = [];

    for (const baseUser of usersSeed) {
      const payload = buildUserPayload(baseUser, passwordHash, USER_ROLE);

      const user = await User.findOneAndUpdate(
        { email: payload.email },
        { $set: payload },
        {
          upsert: true,
          runValidators: true,
          returnDocument: 'after',
        }
      );

      upsertedUsers.push(user);
    }

    const vehicles = await Vehicle.find().lean();

    if (vehicles.length === 0) {
      throw new Error(
        'Nenhum veículo encontrado. Cadastre veículos antes de executar a seed demo.'
      );
    }

    const adminUsers = upsertedUsers.filter((user) => user.role === USER_ROLE.ADMIN);
    const commonUsers = upsertedUsers.filter((user) => user.role !== USER_ROLE.ADMIN);

  await RentalRequest.deleteMany({});

    const motives = [
      'Visita a fornecedor em Campinas',
      'Reunião comercial com cliente estratégico',
      'Treinamento presencial na filial',
      'Entrega de documentos contratuais',
      'Auditoria operacional externa',
      'Visita técnica em unidade remota',
      'Reunião com diretoria regional',
      'Suporte técnico em campo',
      'Inspeção de frota terceirizada',
      'Alinhamento com parceiro logístico',
      'Levantamento operacional em obra',
      'Atendimento emergencial em cliente',
    ];

    const availableStatuses = getEnumValues(RentalRequest, 'status');
    const statusPlan = resolveStatusPlan(availableStatuses);

    if (statusPlan.length === 0) {
      throw new Error(
        'Não foi possível montar a distribuição de status. Verifique os enums do model RentalRequest.'
      );
    }

    const requestsPayload = [];

    for (let index = 0; index < 30; index += 1) {
      const user = pickRandom(commonUsers);
      const vehicle = pickRandom(vehicles);
      const status = statusPlan[index % statusPlan.length];

      const daysBack = randomInt(3, 120);
      const startDate = daysAgo(daysBack);
      const endDate = addHours(startDate, randomInt(4, 36));
      const updatedAt = addHours(endDate, randomInt(2, 24));
      const approvedBy = pickRandom(adminUsers)?._id || null;

      const reason = pickRandom(motives);

      const payload = buildRequestPayload({
        RentalRequest,
        userId: user._id,
        vehicleId: vehicle._id,
        status,
        startDate,
        endDate,
        reason,
        approvedBy,
        createdAt: startDate,
        updatedAt,
      });

      requestsPayload.push(payload);
    }

    if (requestsPayload.length > 0) {
      await RentalRequest.insertMany(requestsPayload, { ordered: false });
    }

    console.log('✅ Demo seed concluída com sucesso');
    console.log('');
    console.log('Usuários demo disponíveis:');
    console.log('- admin@fleet.com / 123456');
    console.log('- mariana@fleet.com / 123456');
    console.log('- joao.silva@empresa.com / 123456');
    console.log('- maria.souza@empresa.com / 123456');
    console.log('');
    console.log(`Usuários upsertados: ${upsertedUsers.length}`);
    console.log(`Veículos existentes reutilizados: ${vehicles.length}`);
    console.log(`Solicitações demo inseridas: ${requestsPayload.length}`);

    await closeConnectionSafely();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed demo falhou:', error);
    await closeConnectionSafely();
    process.exit(1);
  }
}

run();