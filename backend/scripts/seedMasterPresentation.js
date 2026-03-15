require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDatabase = require('../src/config/database');

const BCRYPT_SALT_ROUNDS = 10;
const DEMO_PASSWORD = '123456';

/*
ENGINEERING NOTE:
This is the full presentation dataset seed used to demonstrate the
complete rental lifecycle inside the Fleet Vehicle Scheduling system.

The generated dataset includes multiple rental states:
- pending
- approved
- return_pending
- completed
- rejected
- cancelled

The goal is to produce realistic operational scenarios that allow
dashboards, admin panels and analytics to be demonstrated with
representative data.
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
    throw new Error(`Não foi possível resolver o model em ${modulePath}`);
  }

  return model;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const cloned = [...items];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }

  return cloned;
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function addHours(date, hours) {
  const value = new Date(date);
  value.setHours(value.getHours() + hours);
  return value;
}

function subtractDays(date, days) {
  return addDays(date, -days);
}

/*
NOTE:
Date window helpers generate realistic reservation periods
relative to the current date, enabling demo datasets to
remain relevant over time.
*/
function createWindow(daysAgoStart, durationDays) {
  const start = startOfDay(subtractDays(new Date(), daysAgoStart));
  const end = addDays(start, Math.max(0, durationDays - 1));
  return { start, end };
}

function createFutureWindow(daysAheadStart, durationDays) {
  const start = startOfDay(addDays(new Date(), daysAheadStart));
  const end = addDays(start, Math.max(0, durationDays - 1));
  return { start, end };
}

function createRecentWindow(daysAgoStart, durationDays) {
  const start = startOfDay(subtractDays(new Date(), daysAgoStart));
  const end = addDays(start, Math.max(0, durationDays - 1));
  return { start, end };
}

/*
ENGINEERING NOTE:
Status distribution intentionally overrepresents completed rentals
so dashboards and historical views contain meaningful data.
*/
function buildStatuses(RENTAL_STATUS) {
  return [
    RENTAL_STATUS.PENDING,
    RENTAL_STATUS.PENDING,
    RENTAL_STATUS.PENDING,
    RENTAL_STATUS.PENDING,
    RENTAL_STATUS.PENDING,

    RENTAL_STATUS.APPROVED,
    RENTAL_STATUS.APPROVED,
    RENTAL_STATUS.APPROVED,
    RENTAL_STATUS.APPROVED,
    RENTAL_STATUS.APPROVED,
    RENTAL_STATUS.APPROVED,

    RENTAL_STATUS.RETURN_PENDING,
    RENTAL_STATUS.RETURN_PENDING,
    RENTAL_STATUS.RETURN_PENDING,
    RENTAL_STATUS.RETURN_PENDING,

    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,
    RENTAL_STATUS.COMPLETED,

    RENTAL_STATUS.REJECTED,
    RENTAL_STATUS.REJECTED,
    RENTAL_STATUS.REJECTED,
    RENTAL_STATUS.REJECTED,

    RENTAL_STATUS.CANCELLED,
    RENTAL_STATUS.CANCELLED,
    RENTAL_STATUS.CANCELLED,
  ];
}

function buildPurposes() {
  return [
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
    'Treinamento na filial 505',
    'Reunião de alinhamento com operação',
    'Visita ao cliente MKG Metals',
    'Acompanhamento de implantação',
    'Apresentação de projeto para diretoria',
    'Rota de apoio para equipe técnica',
    'Visita de relacionamento com fornecedor',
    'Reunião com parceiro de manutenção',
  ];
}

function buildAdminNotes(status) {
  const map = {
    pending: '',
    approved: [
      'Aprovado conforme disponibilidade da frota.',
      'Solicitação aprovada para atendimento operacional.',
      'Reserva aprovada sem restrições.',
      'Fluxo validado pela administração.',
    ],
    return_pending: [
      'Devolução aguardando confirmação administrativa.',
      'Solicitação de devolução em análise.',
      'Retorno enviado pelo usuário e pendente de conferência.',
    ],
    completed: [
      'Reserva finalizada e devolução confirmada.',
      'Encerramento operacional concluído com sucesso.',
      'Veículo devolvido e fluxo encerrado.',
      'Reserva concluída sem pendências.',
    ],
    rejected: [
      'Solicitação rejeitada por indisponibilidade da frota.',
      'Pedido recusado por conflito de agenda.',
      'Reserva rejeitada por prioridade operacional.',
      'Solicitação não aprovada pela administração.',
    ],
    cancelled: [
      'Solicitação cancelada pelo usuário.',
      'Cancelamento registrado antes do início da reserva.',
      'Reserva cancelada por mudança de agenda.',
    ],
  };

  const options = map[status] || [''];
  return pickRandom(options);
}

function buildReturnNotes() {
  return pickRandom([
    'Veículo devolvido no pátio administrativo.',
    'Retorno realizado após visita técnica.',
    'Uso concluído e devolução solicitada via sistema.',
    'Entrega realizada sem ocorrências.',
  ]);
}

function buildCompletionNotes() {
  return pickRandom([
    'Devolução validada e encerrada pela administração.',
    'Conferência de retorno concluída sem divergências.',
    'Fluxo finalizado após validação da quilometragem.',
    'Encerramento administrativo realizado com sucesso.',
  ]);
}

function buildUsersSeed(USER_ROLE) {
  return [
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
      registrationId: 'USR001',
    },
    {
      name: 'Maria Souza',
      email: 'maria.souza@empresa.com',
      role: USER_ROLE.USER,
      department: 'Comercial',
      registrationId: 'USR002',
    },
    {
      name: 'Carlos Pereira',
      email: 'carlos.pereira@empresa.com',
      role: USER_ROLE.USER,
      department: 'Suporte Técnico',
      registrationId: 'USR003',
    },
    {
      name: 'Ana Lima',
      email: 'ana.lima@empresa.com',
      role: USER_ROLE.USER,
      department: 'Financeiro',
      registrationId: 'USR004',
    },
    {
      name: 'Felipe Rocha',
      email: 'felipe.rocha@empresa.com',
      role: USER_ROLE.USER,
      department: 'Operações',
      registrationId: 'USR005',
    },
    {
      name: 'Juliana Martins',
      email: 'juliana.martins@empresa.com',
      role: USER_ROLE.USER,
      department: 'Jurídico',
      registrationId: 'USR006',
    },
    {
      name: 'Roberto Alves',
      email: 'roberto.alves@empresa.com',
      role: USER_ROLE.USER,
      department: 'Infraestrutura',
      registrationId: 'USR007',
    },
    {
      name: 'Camila Costa',
      email: 'camila.costa@empresa.com',
      role: USER_ROLE.USER,
      department: 'RH',
      registrationId: 'USR008',
    },
  ];
}

function buildUserPayload(base, passwordHash) {
  return {
    name: base.name,
    email: base.email,
    password: passwordHash,
    role: base.role,
    department: base.department || '',
    registrationId: base.registrationId || '',
  };
}

function buildRentalPayload({
  userId,
  vehicleId,
  status,
  startDate,
  endDate,
  purpose,
  adminNotes,
  returnRequestedMileage,
  returnRequestedAt,
  returnNotes,
  actualMileage,
  completedAt,
  completionNotes,
  createdAt,
  updatedAt,
}) {
  const payload = {
    user: userId,
    vehicle: vehicleId,
    startDate,
    endDate,
    purpose,
    status,
    adminNotes,
    createdAt,
    updatedAt,
  };

  if (typeof returnRequestedMileage === 'number') {
    payload.returnRequestedMileage = returnRequestedMileage;
  }

  if (returnRequestedAt) {
    payload.returnRequestedAt = returnRequestedAt;
  }

  if (returnNotes) {
    payload.returnNotes = returnNotes;
  }

  if (typeof actualMileage === 'number') {
    payload.actualMileage = actualMileage;
  }

  if (completedAt) {
    payload.completedAt = completedAt;
  }

  if (completionNotes) {
    payload.completionNotes = completionNotes;
  }

  return payload;
}

async function closeConnectionSafely() {
  try {
    await mongoose.connection.close();
  } catch (_) {}
}

async function run() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não encontrada no arquivo .env');
    }

    await connectDatabase();

    const { User, USER_ROLE } = require('../src/models/User');
    const Vehicle = loadModel('../src/models/Vehicle', 'Vehicle');
    const rentalModule = require('../src/models/RentalRequest');
    const RentalRequest = rentalModule.RentalRequest || rentalModule;
    const RENTAL_STATUS = rentalModule.RENTAL_STATUS;

    if (!RentalRequest || !RENTAL_STATUS) {
      throw new Error('Não foi possível resolver RentalRequest / RENTAL_STATUS');
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_SALT_ROUNDS);
    const usersSeed = buildUsersSeed(USER_ROLE);

    const upsertedUsers = [];

    for (const baseUser of usersSeed) {
      const payload = buildUserPayload(baseUser, passwordHash);

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
        'Nenhum veículo encontrado. Rode a seed da frota antes da seed master.'
      );
    }

    await RentalRequest.deleteMany({});

    const adminUsers = upsertedUsers.filter((user) => user.role === USER_ROLE.ADMIN);
    const commonUsers = upsertedUsers.filter((user) => user.role !== USER_ROLE.ADMIN);
    const statuses = buildStatuses(RENTAL_STATUS);
    const purposes = buildPurposes();

    const rentals = [];
    const rotatedVehicles = shuffle(vehicles);
    const rotatedUsers = shuffle(commonUsers);

    for (let index = 0; index < statuses.length; index += 1) {
      const status = statuses[index];
      const user = rotatedUsers[index % rotatedUsers.length];
      const vehicle = rotatedVehicles[index % rotatedVehicles.length];
      const purpose = purposes[index % purposes.length];
      const adminNotes = buildAdminNotes(status);

      let startDate;
      let endDate;
      let createdAt;
      let updatedAt;
      let returnRequestedMileage;
      let returnRequestedAt;
      let returnNotes;
      let actualMileage;
      let completedAt;
      let completionNotes;

      if (status === RENTAL_STATUS.PENDING) {
        const window = createFutureWindow(randomInt(1, 12), randomInt(1, 3));
        startDate = window.start;
        endDate = window.end;
        createdAt = addHours(subtractDays(startDate, randomInt(1, 4)), randomInt(8, 17));
        updatedAt = addHours(createdAt, randomInt(1, 8));
      } else if (status === RENTAL_STATUS.APPROVED) {
        const window = createFutureWindow(randomInt(0, 8), randomInt(1, 4));
        startDate = window.start;
        endDate = window.end;
        createdAt = addHours(subtractDays(startDate, randomInt(1, 5)), randomInt(8, 17));
        updatedAt = addHours(createdAt, randomInt(2, 24));
      } else if (status === RENTAL_STATUS.RETURN_PENDING) {
        const window = createRecentWindow(randomInt(0, 6), randomInt(1, 3));
        startDate = window.start;
        endDate = window.end;
        createdAt = addHours(subtractDays(startDate, randomInt(1, 4)), randomInt(8, 17));
        returnRequestedAt = addHours(endDate, randomInt(1, 12));
        updatedAt = addHours(returnRequestedAt, randomInt(0, 6));
        returnRequestedMileage = vehicle.mileage + randomInt(80, 650);
        returnNotes = buildReturnNotes();
      } else if (status === RENTAL_STATUS.COMPLETED) {
        const window = createWindow(randomInt(7, 120), randomInt(1, 4));
        startDate = window.start;
        endDate = window.end;
        createdAt = addHours(subtractDays(startDate, randomInt(1, 5)), randomInt(8, 17));
        completedAt = addHours(endDate, randomInt(2, 18));
        updatedAt = addHours(completedAt, randomInt(0, 4));
        actualMileage = vehicle.mileage + randomInt(120, 1100);
        completionNotes = buildCompletionNotes();
      } else if (status === RENTAL_STATUS.REJECTED) {
        const window = createWindow(randomInt(10, 90), randomInt(1, 3));
        startDate = window.start;
        endDate = window.end;
        createdAt = addHours(subtractDays(startDate, randomInt(1, 4)), randomInt(8, 17));
        updatedAt = addHours(createdAt, randomInt(1, 8));
      } else if (status === RENTAL_STATUS.CANCELLED) {
        const window = createWindow(randomInt(5, 75), randomInt(1, 3));
        startDate = window.start;
        endDate = window.end;
        createdAt = addHours(subtractDays(startDate, randomInt(1, 4)), randomInt(8, 17));
        updatedAt = addHours(createdAt, randomInt(1, 8));
      } else {
        continue;
      }

      rentals.push(
        buildRentalPayload({
          userId: user._id,
          vehicleId: vehicle._id,
          status,
          startDate,
          endDate,
          purpose,
          adminNotes,
          returnRequestedMileage,
          returnRequestedAt,
          returnNotes,
          actualMileage,
          completedAt,
          completionNotes,
          createdAt,
          updatedAt,
        })
      );
    }

    await RentalRequest.insertMany(rentals, { ordered: true });

    console.log('✅ Seed master concluída com sucesso');
    console.log('');
    console.log('Credenciais demo:');
    console.log('- Admin: eduardo@fleet.com / 123456');
    console.log('- Admin: mariana@fleet.com / 123456');
    console.log('- User: joao.silva@empresa.com / 123456');
    console.log('- User: maria.souza@empresa.com / 123456');
    console.log('- User: carlos.pereira@empresa.com / 123456');
    console.log('- User: ana.lima@empresa.com / 123456');
    console.log('');
    console.log(`Usuários demo disponíveis: ${upsertedUsers.length}`);
    console.log(`Veículos reutilizados: ${vehicles.length}`);
    console.log(`Reservas geradas: ${rentals.length}`);
    console.log('');
    console.log('Distribuição prevista:');
    console.log('- 5 pendentes');
    console.log('- 6 aprovadas');
    console.log('- 4 aguardando devolução');
    console.log('- 14 concluídas');
    console.log('- 4 rejeitadas');
    console.log('- 3 canceladas');

    await closeConnectionSafely();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed master falhou:', error);
    await closeConnectionSafely();
    process.exit(1);
  }
}

run();