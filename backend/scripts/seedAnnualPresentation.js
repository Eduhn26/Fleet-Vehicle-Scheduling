require('dotenv').config();

const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDatabase = require('../src/config/database');
const { User, USER_ROLE } = require('../src/models/User');
const {
  Vehicle,
  VEHICLE_STATUS,
  TRANSMISSION_TYPE,
  FUEL_TYPE,
} = require('../src/models/Vehicle');
const {
  RentalRequest,
  RENTAL_STATUS,
} = require('../src/models/RentalRequest');
const {
  VehicleMileageHistory,
} = require('../src/models/VehicleMileageHistory');

const YEAR = Number(process.env.ANNUAL_SEED_YEAR || 2025);
const RANDOM_SEED = Number(process.env.ANNUAL_SEED_RANDOM || 20250101);
const DRY_RUN =
  process.argv.includes('--dry-run') ||
  process.env.ANNUAL_SEED_DRY_RUN === 'true';

const COMPANY_EMPLOYEES = 1000;
const COMMON_USERS = 220;
const ADMIN_USERS = 6;
const VEHICLE_COUNT = 5;
const RENTAL_COUNT = 1620;

const DEMO_PASSWORD = process.env.ANNUAL_SEED_PASSWORD || 'Fleet2025!';
const BCRYPT_SALT_ROUNDS = 10;

const MONTHLY_TOTALS = [
  100, 110, 140, 145, 155, 135, 110, 150, 165, 170, 145, 95,
];

const STATUS_TARGETS = {
  [RENTAL_STATUS.COMPLETED]: 1330,
  [RENTAL_STATUS.REJECTED]: 140,
  [RENTAL_STATUS.CANCELLED]: 100,
  [RENTAL_STATUS.PENDING]: 20,
  [RENTAL_STATUS.APPROVED]: 20,
  [RENTAL_STATUS.RETURN_PENDING]: 10,
};

const DEPARTMENT_PLAN = [
  { name: 'Operações', users: 62, rentalShare: 27 },
  { name: 'Suporte Técnico', users: 38, rentalShare: 18 },
  { name: 'Comercial', users: 30, rentalShare: 15 },
  { name: 'Logística', users: 24, rentalShare: 12 },
  { name: 'Engenharia', users: 20, rentalShare: 9 },
  { name: 'Infraestrutura', users: 16, rentalShare: 7 },
  { name: 'Financeiro', users: 7, rentalShare: 3 },
  { name: 'Recursos Humanos', users: 6, rentalShare: 3 },
  { name: 'Gestão', users: 6, rentalShare: 2 },
  { name: 'Compras', users: 5, rentalShare: 2 },
  { name: 'Jurídico', users: 3, rentalShare: 1 },
  { name: 'Qualidade e Segurança', users: 3, rentalShare: 1 },
];

const ADMIN_SEED = [
  ['Eduardo Henrique', 'eduardo.admin@demo.fleet.local'],
  ['Mariana Lopes', 'mariana.admin@demo.fleet.local'],
  ['Rafael Martins', 'rafael.admin@demo.fleet.local'],
  ['Camila Ferreira', 'camila.admin@demo.fleet.local'],
  ['Bruno Almeida', 'bruno.admin@demo.fleet.local'],
  ['Patrícia Gomes', 'patricia.admin@demo.fleet.local'],
];

const FIRST_NAMES = [
  'Ana',
  'Bruno',
  'Camila',
  'Carlos',
  'Daniel',
  'Eduarda',
  'Felipe',
  'Fernanda',
  'Gabriel',
  'Helena',
  'Igor',
  'Isabela',
  'João',
  'Juliana',
  'Larissa',
  'Leonardo',
  'Lucas',
  'Mariana',
  'Mateus',
  'Natália',
  'Paulo',
  'Priscila',
  'Rafael',
  'Renata',
  'Ricardo',
  'Roberta',
  'Sabrina',
  'Samuel',
  'Tatiane',
  'Thiago',
  'Vanessa',
  'Vinícius',
];

const LAST_NAMES = [
  'Almeida',
  'Alves',
  'Barbosa',
  'Cardoso',
  'Carvalho',
  'Costa',
  'Dias',
  'Ferreira',
  'Freitas',
  'Gomes',
  'Lima',
  'Lopes',
  'Martins',
  'Mendes',
  'Monteiro',
  'Moreira',
  'Nascimento',
  'Oliveira',
  'Pereira',
  'Ramos',
  'Ribeiro',
  'Rocha',
  'Rodrigues',
  'Santana',
  'Santos',
  'Silva',
  'Souza',
  'Teixeira',
];

const PURPOSES_BY_DEPARTMENT = {
  Operações: [
    'Inspeção operacional em unidade regional',
    'Acompanhamento de atividade em campo',
    'Visita técnica a fornecedor',
    'Apoio operacional em unidade externa',
    'Levantamento de capacidade em operação',
  ],
  'Suporte Técnico': [
    'Atendimento técnico em cliente',
    'Instalação de equipamento em campo',
    'Manutenção corretiva em unidade',
    'Diagnóstico técnico presencial',
    'Suporte de infraestrutura em filial',
  ],
  Comercial: [
    'Reunião comercial com cliente',
    'Apresentação de proposta presencial',
    'Visita de relacionamento',
    'Negociação com cliente regional',
    'Acompanhamento de implantação comercial',
  ],
  Logística: [
    'Acompanhamento de entrega',
    'Auditoria em transportadora',
    'Visita a centro de distribuição',
    'Inspeção de rota logística',
    'Alinhamento com operador logístico',
  ],
  Engenharia: [
    'Vistoria técnica em obra',
    'Levantamento de campo',
    'Inspeção de instalação',
    'Acompanhamento de projeto',
    'Validação técnica em unidade',
  ],
  Infraestrutura: [
    'Inspeção predial',
    'Atendimento de infraestrutura em filial',
    'Visita para manutenção preventiva',
    'Levantamento de ativos',
    'Acompanhamento de serviço terceirizado',
  ],
  Financeiro: [
    'Entrega de documentos bancários',
    'Auditoria externa',
    'Reunião com instituição financeira',
    'Visita a prestador de serviços',
  ],
  'Recursos Humanos': [
    'Treinamento presencial',
    'Integração em unidade regional',
    'Processo seletivo externo',
    'Visita de acompanhamento de equipe',
  ],
  Gestão: [
    'Reunião com diretoria regional',
    'Visita de gestão em unidade',
    'Comitê executivo presencial',
    'Acompanhamento de indicadores em filial',
  ],
  Compras: [
    'Visita para homologação de fornecedor',
    'Negociação presencial com fornecedor',
    'Inspeção de material',
    'Acompanhamento de processo de compras',
  ],
  Jurídico: [
    'Audiência presencial',
    'Entrega de documentos em cartório',
    'Reunião com escritório externo',
    'Acompanhamento jurídico em unidade',
  ],
  'Qualidade e Segurança': [
    'Auditoria de qualidade',
    'Inspeção de segurança',
    'Investigação de ocorrência',
    'Treinamento de segurança em unidade',
    'Verificação de conformidade operacional',
  ],
};

const ADMIN_NOTES = {
  [RENTAL_STATUS.APPROVED]: [
    'Aprovado conforme disponibilidade da frota.',
    'Reserva aprovada para atendimento operacional.',
    'Solicitação validada pela administração.',
  ],
  [RENTAL_STATUS.RETURN_PENDING]: [
    'Devolução aguardando conferência administrativa.',
    'Retorno enviado e pendente de validação.',
    'Quilometragem informada pelo usuário e aguardando confirmação.',
  ],
  [RENTAL_STATUS.COMPLETED]: [
    'Reserva concluída sem pendências.',
    'Devolução confirmada pela administração.',
    'Fluxo encerrado após conferência da quilometragem.',
  ],
  [RENTAL_STATUS.REJECTED]: [
    'Solicitação rejeitada por indisponibilidade da frota.',
    'Pedido recusado por conflito de agenda.',
    'Solicitação não aprovada por prioridade operacional.',
  ],
  [RENTAL_STATUS.CANCELLED]: [
    'Solicitação cancelada pelo usuário.',
    'Cancelamento registrado antes do início da reserva.',
    'Reserva cancelada por alteração de agenda.',
  ],
  [RENTAL_STATUS.PENDING]: [''],
};

const RETURN_NOTES = [
  'Veículo devolvido no pátio administrativo.',
  'Retorno realizado após atendimento externo.',
  'Uso concluído e devolução solicitada pelo sistema.',
  'Entrega realizada sem ocorrências.',
];

const COMPLETION_NOTES = [
  'Devolução validada sem divergências.',
  'Quilometragem conferida e fluxo encerrado.',
  'Retorno aprovado pela administração.',
  'Encerramento administrativo concluído.',
];

const VEHICLE_SEED = [
  [
    'Jeep',
    'Compass',
    2024,
    'JEE5P67',
    'Chumbo',
    'suv',
    1.15,
    4500,
    'automatic',
    'flex',
    5,
  ],
  [
    'Volkswagen',
    'Polo Highline',
    2023,
    'POL1H23',
    'Chumbo',
    'sedan',
    1.35,
    32000,
    'automatic',
    'flex',
    5,
  ],
  [
    'Toyota',
    'Yaris',
    2023,
    'YAR1S23',
    'Branco',
    'compact',
    1.3,
    7800,
    'automatic',
    'flex',
    5,
  ],
  [
    'Toyota',
    'Etios',
    2022,
    'ETI1234',
    'Branco',
    'compact',
    1.0,
    15000,
    'manual',
    'flex',
    5,
  ],
  [
    'Honda',
    'HRV',
    2020,
    'HRV2A20',
    'Prata',
    'suv',
    1.2,
    25000,
    'automatic',
    'flex',
    5,
  ],
];

const CATEGORY_PREFERENCES = {
  Operações: { compact: 1.2, sedan: 1.1, suv: 1.1, utility: 1.3, van: 0.8, mpv: 1.0 },
  'Suporte Técnico': { compact: 0.9, sedan: 0.9, suv: 1.1, utility: 1.8, van: 1.4, mpv: 1.0 },
  Comercial: { compact: 1.3, sedan: 1.8, suv: 1.4, utility: 0.4, van: 0.2, mpv: 0.5 },
  Logística: { compact: 0.5, sedan: 0.6, suv: 1.0, utility: 2.0, van: 2.4, mpv: 1.0 },
  Engenharia: { compact: 0.7, sedan: 0.8, suv: 1.5, utility: 1.8, van: 1.1, mpv: 0.8 },
  Infraestrutura: { compact: 0.8, sedan: 0.8, suv: 1.2, utility: 1.6, van: 1.2, mpv: 1.0 },
  Financeiro: { compact: 1.4, sedan: 1.5, suv: 0.8, utility: 0.2, van: 0.1, mpv: 0.5 },
  'Recursos Humanos': { compact: 1.1, sedan: 1.1, suv: 0.9, utility: 0.3, van: 0.5, mpv: 1.7 },
  Gestão: { compact: 0.9, sedan: 1.8, suv: 1.8, utility: 0.2, van: 0.1, mpv: 0.6 },
  Compras: { compact: 0.8, sedan: 0.9, suv: 1.1, utility: 1.6, van: 1.1, mpv: 0.8 },
  Jurídico: { compact: 1.1, sedan: 1.8, suv: 1.0, utility: 0.2, van: 0.1, mpv: 0.4 },
  'Qualidade e Segurança': { compact: 0.7, sedan: 0.7, suv: 1.3, utility: 1.7, van: 1.0, mpv: 0.8 },
};

const DISTANCE_PROFILES = {
  field: [
    [8, 30, 20],
    [30, 70, 30],
    [70, 150, 35],
    [150, 300, 12],
    [300, 500, 3],
  ],
  balanced: [
    [8, 30, 35],
    [30, 70, 35],
    [70, 150, 22],
    [150, 300, 7],
    [300, 500, 1],
  ],
  office: [
    [8, 30, 60],
    [30, 70, 30],
    [70, 150, 8],
    [150, 300, 2],
  ],
  logistics: [
    [8, 30, 15],
    [30, 70, 25],
    [70, 150, 38],
    [150, 300, 18],
    [300, 500, 4],
  ],
};

const PROFILE_BY_DEPARTMENT = {
  Operações: 'field',
  'Suporte Técnico': 'field',
  Comercial: 'balanced',
  Logística: 'logistics',
  Engenharia: 'field',
  Infraestrutura: 'field',
  Financeiro: 'office',
  'Recursos Humanos': 'office',
  Gestão: 'balanced',
  Compras: 'balanced',
  Jurídico: 'office',
  'Qualidade e Segurança': 'field',
};

function createRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(RANDOM_SEED);

function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pickRandom(items) {
  return items[randomInt(0, items.length - 1)];
}

function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [result[index], result[swapIndex]] = [
      result[swapIndex],
      result[index],
    ];
  }

  return result;
}

function repeatValue(value, count) {
  return Array.from({ length: count }, () => value);
}

function deterministicObjectId(namespace, index) {
  const hex = crypto
    .createHash('sha256')
    .update(`${YEAR}:${namespace}:${index}`)
    .digest('hex')
    .slice(0, 24);

  return new mongoose.Types.ObjectId(hex);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date, days) {
  return addMinutes(date, days * 24 * 60);
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function allocateCounts(total, items, shareField) {
  const raw = items.map((item) => ({
    item,
    exact: (total * item[shareField]) / 100,
  }));

  const allocated = raw.map(({ item, exact }) => ({
    item,
    count: Math.floor(exact),
    remainder: exact - Math.floor(exact),
  }));

  let remaining =
    total - allocated.reduce((sum, entry) => sum + entry.count, 0);

  allocated
    .sort((left, right) => right.remainder - left.remainder)
    .forEach((entry) => {
      if (remaining > 0) {
        entry.count += 1;
        remaining -= 1;
      }
    });

  return allocated;
}

function weightedPick(items, weightFactory) {
  const weighted = items
    .map((item) => ({
      item,
      weight: Math.max(0, Number(weightFactory(item)) || 0),
    }))
    .filter((entry) => entry.weight > 0);

  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);

  if (total <= 0) {
    throw new Error('Não existem opções disponíveis para seleção ponderada.');
  }

  let cursor = random() * total;

  for (const entry of weighted) {
    cursor -= entry.weight;

    if (cursor <= 0) {
      return entry.item;
    }
  }

  return weighted[weighted.length - 1].item;
}

function buildUsers(passwordHash) {
  const createdAt = new Date(Date.UTC(YEAR - 1, 11, 15, 12, 0, 0));
  const users = [];
  const commonUsersByDepartment = new Map();

  ADMIN_SEED.forEach(([name, email], index) => {
    users.push({
      _id: deterministicObjectId('admin', index + 1),
      name,
      email,
      password: passwordHash,
      role: USER_ROLE.ADMIN,
      department: 'Gestão',
      registrationId: `ADM${String(index + 1).padStart(3, '0')}`,
      createdAt,
      updatedAt: createdAt,
    });
  });

  let globalIndex = 0;

  for (const department of DEPARTMENT_PLAN) {
    const departmentUsers = [];

    for (let index = 0; index < department.users; index += 1) {
      globalIndex += 1;

      const firstName = FIRST_NAMES[(globalIndex * 7) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(globalIndex * 11) % LAST_NAMES.length];
      const secondLastName =
        LAST_NAMES[(globalIndex * 17 + 3) % LAST_NAMES.length];
      const name = `${firstName} ${lastName} ${secondLastName}`;
      const email = `${slugify(firstName)}.${slugify(lastName)}.${String(
        globalIndex
      ).padStart(3, '0')}@demo.fleet.local`;

      const user = {
        _id: deterministicObjectId('user', globalIndex),
        name,
        email,
        password: passwordHash,
        role: USER_ROLE.USER,
        department: department.name,
        registrationId: `USR${String(globalIndex).padStart(4, '0')}`,
        createdAt,
        updatedAt: createdAt,
        usageWeight: 0.55 + random() * 1.45,
      };

      users.push(user);
      departmentUsers.push(user);
    }

    commonUsersByDepartment.set(department.name, departmentUsers);
  }

  return {
    users: users.map(({ usageWeight, ...user }) => user),
    commonUsersByDepartment,
  };
}

function buildVehicles() {
  const createdAt = new Date(Date.UTC(YEAR - 1, 11, 1, 12, 0, 0));

  return VEHICLE_SEED.map((entry, index) => {
    const [
      brand,
      model,
      year,
      licensePlate,
      color,
      category,
      usageWeight,
      initialMileage,
      transmissionType,
      fuelType,
      passengers,
    ] = entry;

    const _id = deterministicObjectId('vehicle', index + 1);

    return {
      config: {
        _id,
        category,
        usageWeight,
        initialMileage,
        index,
      },
      document: {
        _id,
        brand,
        model,
        year,
        licensePlate,
        color,
        mileage: initialMileage,
        status: VEHICLE_STATUS.AVAILABLE,
        transmissionType:
          transmissionType === 'automatic'
            ? TRANSMISSION_TYPE.AUTOMATIC
            : TRANSMISSION_TYPE.MANUAL,
        fuelType: FUEL_TYPE[fuelType.toUpperCase()],
        passengers,
        nextMaintenance: initialMileage + 10000,
        lastMaintenanceMileage: initialMileage,
        imageUrl: '',
        createdAt,
        updatedAt: createdAt,
      },
    };
  });
}

function isHoliday(date) {
  const holidays = new Set([
    `${YEAR}-01-01`,
    `${YEAR}-03-03`,
    `${YEAR}-03-04`,
    `${YEAR}-04-18`,
    `${YEAR}-04-21`,
    `${YEAR}-05-01`,
    `${YEAR}-06-19`,
    `${YEAR}-09-07`,
    `${YEAR}-10-12`,
    `${YEAR}-11-02`,
    `${YEAR}-11-15`,
    `${YEAR}-11-20`,
    `${YEAR}-12-24`,
    `${YEAR}-12-25`,
    `${YEAR}-12-31`,
  ]);

  return holidays.has(formatDateKey(date));
}

function buildSlot(date, period) {
  const dayOfWeek = date.getUTCDay();
  let startHour;
  let startMinute;
  let durationSlots;

  if (dayOfWeek === 6) {
    startHour = randomInt(8, 10);
    startMinute = pickRandom([0, 30]);
    durationSlots = randomInt(5, 10);
  } else if (period === 'am') {
    startHour = randomInt(6, 8);
    startMinute = pickRandom([0, 30]);
    durationSlots = randomInt(5, 10);
  } else {
    startHour = randomInt(13, 15);
    startMinute = pickRandom([0, 30]);
    durationSlots = randomInt(5, 10);
  }

  const startDate = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      startHour,
      startMinute,
      0,
      0
    )
  );

  const endDate = addMinutes(startDate, durationSlots * 30);

  return {
    startDate,
    endDate,
    lateDecember:
      date.getUTCMonth() === 11 && date.getUTCDate() >= 22,
    used: false,
  };
}

function buildSlotPools(vehicleConfigs) {
  const pools = Array.from({ length: 12 }, () => new Map());

  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const daysInMonth = new Date(
      Date.UTC(YEAR, monthIndex + 1, 0)
    ).getUTCDate();

    for (const vehicle of vehicleConfigs) {
      const slots = [];

      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(Date.UTC(YEAR, monthIndex, day, 12, 0, 0));
        const weekday = date.getUTCDay();

        if (weekday === 0 || isHoliday(date)) {
          continue;
        }

        if (weekday === 6 && random() > 0.35) {
          continue;
        }

        const periods = weekday === 6 ? ['sat'] : ['am', 'pm'];

        for (const period of periods) {
          const slot = buildSlot(date, period);
          const weekdayWeight =
            weekday >= 2 && weekday <= 4
              ? 1.35
              : weekday === 6
                ? 0.35
                : 1;

          slot.order =
            -Math.log(Math.max(random(), Number.EPSILON)) / weekdayWeight;
          slots.push(slot);
        }
      }

      slots.sort((left, right) => left.order - right.order);
      pools[monthIndex].set(vehicle.index, slots);
    }
  }

  return pools;
}

function vehiclePreference(vehicle, department) {
  const preferences = CATEGORY_PREFERENCES[department] || {};
  return vehicle.usageWeight * (preferences[vehicle.category] || 1);
}

function hasAvailableSlot(slots, restrictLateDecember) {
  return slots.some(
    (slot) =>
      !slot.used && (!restrictLateDecember || slot.lateDecember)
  );
}

function takeSlot({
  monthIndex,
  department,
  restrictLateDecember,
  slotPools,
  vehicleConfigs,
}) {
  const candidates = vehicleConfigs.filter((vehicle) =>
    hasAvailableSlot(
      slotPools[monthIndex].get(vehicle.index),
      restrictLateDecember
    )
  );

  if (candidates.length === 0) {
    throw new Error(
      `Sem slots disponíveis para ${department} no mês ${monthIndex + 1}.`
    );
  }

  const vehicle = weightedPick(candidates, (candidate) =>
    vehiclePreference(candidate, department)
  );

  const slots = slotPools[monthIndex].get(vehicle.index);
  const slot = slots.find(
    (candidate) =>
      !candidate.used &&
      (!restrictLateDecember || candidate.lateDecember)
  );

  if (!slot) {
    throw new Error('Falha ao reservar slot determinístico.');
  }

  slot.used = true;

  return {
    vehicle,
    startDate: slot.startDate,
    endDate: slot.endDate,
  };
}

function buildDepartmentPool() {
  const allocations = allocateCounts(
    RENTAL_COUNT,
    DEPARTMENT_PLAN,
    'rentalShare'
  );

  return shuffle(
    allocations.flatMap(({ item, count }) =>
      repeatValue(item.name, count)
    )
  );
}

function buildStatusPools() {
  const openStatuses = shuffle([
    ...repeatValue(RENTAL_STATUS.PENDING, STATUS_TARGETS.pending),
    ...repeatValue(RENTAL_STATUS.APPROVED, STATUS_TARGETS.approved),
    ...repeatValue(
      RENTAL_STATUS.RETURN_PENDING,
      STATUS_TARGETS.return_pending
    ),
  ]);

  const closedStatuses = shuffle([
    ...repeatValue(RENTAL_STATUS.COMPLETED, STATUS_TARGETS.completed),
    ...repeatValue(RENTAL_STATUS.REJECTED, STATUS_TARGETS.rejected),
    ...repeatValue(RENTAL_STATUS.CANCELLED, STATUS_TARGETS.cancelled),
  ]);

  return { openStatuses, closedStatuses };
}

function pickUser(users, department) {
  return weightedPick(
    users.get(department),
    (user) => user.usageWeight
  );
}

function buildRentalDates(status, startDate, endDate) {
  const leadDays =
    status === RENTAL_STATUS.PENDING ||
    status === RENTAL_STATUS.APPROVED
      ? randomInt(1, 7)
      : randomInt(2, 14);

  const createdAt = addMinutes(
    addDays(startDate, -leadDays),
    randomInt(8, 17) * 60
  );

  let updatedAt = addMinutes(createdAt, randomInt(30, 24 * 60));

  if (updatedAt >= startDate) {
    updatedAt = addMinutes(startDate, -30);
  }

  return { createdAt, updatedAt };
}

function buildRental({
  index,
  status,
  department,
  user,
  slot,
}) {
  const { createdAt, updatedAt } = buildRentalDates(
    status,
    slot.startDate,
    slot.endDate
  );

  const purpose = pickRandom(PURPOSES_BY_DEPARTMENT[department]);
  const adminNotes = pickRandom(ADMIN_NOTES[status] || ['']);

  return {
    _id: deterministicObjectId('rental', index + 1),
    user: user._id,
    vehicle: slot.vehicle._id,
    startDate: slot.startDate,
    endDate: slot.endDate,
    purpose,
    status,
    adminNotes,
    createdAt,
    updatedAt,
    _department: department,
  };
}

function chooseDistanceBand(department) {
  const profileName = PROFILE_BY_DEPARTMENT[department] || 'balanced';
  const profile = DISTANCE_PROFILES[profileName];

  return weightedPick(profile, (band) => band[2]);
}

function buildTripDistance(department, durationHours) {
  const [min, max] = chooseDistanceBand(department);
  const raw = randomInt(min, max);
  const durationLimit = Math.max(18, Math.floor(durationHours * 82));

  return Math.max(8, Math.min(raw, durationLimit));
}

function applyCompletedMileage({
  rentals,
  vehicleDocuments,
  vehicleConfigs,
}) {
  const mileageByVehicle = new Map(
    vehicleConfigs.map((vehicle) => [
      String(vehicle._id),
      vehicle.initialMileage,
    ])
  );

  const histories = [];

  const completed = rentals
    .filter((rental) => rental.status === RENTAL_STATUS.COMPLETED)
    .sort((left, right) => left.endDate - right.endDate);

  completed.forEach((rental, index) => {
    const vehicleId = String(rental.vehicle);
    const previousMileage = mileageByVehicle.get(vehicleId);
    const durationHours =
      (rental.endDate.getTime() - rental.startDate.getTime()) /
      (60 * 60 * 1000);
    const tripDistance = buildTripDistance(
      rental._department,
      durationHours
    );
    const newMileage = previousMileage + tripDistance;
    const returnRequestedAt = addMinutes(
      rental.endDate,
      randomInt(30, 150)
    );
    const completedAt = addMinutes(
      returnRequestedAt,
      randomInt(30, 180)
    );

    rental.returnRequestedMileage = newMileage;
    rental.returnRequestedAt = returnRequestedAt;
    rental.returnNotes = pickRandom(RETURN_NOTES);
    rental.actualMileage = newMileage;
    rental.completedAt = completedAt;
    rental.completionNotes = pickRandom(COMPLETION_NOTES);
    rental.updatedAt = completedAt;

    histories.push({
      _id: deterministicObjectId('mileage', index + 1),
      vehicle: rental.vehicle,
      rental: rental._id,
      previousMileage,
      newMileage,
      recordedAt: completedAt,
      createdAt: completedAt,
      updatedAt: completedAt,
    });

    mileageByVehicle.set(vehicleId, newMileage);
  });

  const pendingMileageByVehicle = new Map(mileageByVehicle);

  rentals
    .filter(
      (rental) => rental.status === RENTAL_STATUS.RETURN_PENDING
    )
    .sort((left, right) => left.endDate - right.endDate)
    .forEach((rental) => {
      const vehicleId = String(rental.vehicle);
      const baseMileage = pendingMileageByVehicle.get(vehicleId);
      const durationHours =
        (rental.endDate.getTime() - rental.startDate.getTime()) /
        (60 * 60 * 1000);
      const requestedMileage =
        baseMileage +
        buildTripDistance(rental._department, durationHours);
      const returnRequestedAt = addMinutes(
        rental.endDate,
        randomInt(30, 120)
      );

      rental.returnRequestedMileage = requestedMileage;
      rental.returnRequestedAt = returnRequestedAt;
      rental.returnNotes = pickRandom(RETURN_NOTES);
      rental.updatedAt = returnRequestedAt;

      pendingMileageByVehicle.set(vehicleId, requestedMileage);
    });

  vehicleDocuments.forEach((vehicle) => {
    vehicle.mileage = mileageByVehicle.get(String(vehicle._id));
    vehicle.updatedAt = new Date(
      Date.UTC(YEAR, 11, 31, 20, 0, 0)
    );
  });

  return histories;
}

function applyMaintenanceScenario(vehicleDocuments) {
  const ranked = [...vehicleDocuments].sort(
    (left, right) => right.mileage - left.mileage
  );

  ranked.forEach((vehicle, index) => {
    const cycleStart =
      Math.floor(vehicle.mileage / 10000) * 10000;

    vehicle.lastMaintenanceMileage = Math.max(0, cycleStart);

    if (index === 0) {
      vehicle.nextMaintenance = vehicle.mileage - randomInt(100, 350);
      vehicle.status = VEHICLE_STATUS.MAINTENANCE;
    } else if (index === 1) {
      vehicle.nextMaintenance = vehicle.mileage + randomInt(300, 750);
      vehicle.status = VEHICLE_STATUS.AVAILABLE;
    } else if (index === 2) {
      vehicle.nextMaintenance = vehicle.mileage + randomInt(1200, 2200);
      vehicle.status = VEHICLE_STATUS.AVAILABLE;
    } else {
      vehicle.nextMaintenance = vehicle.mileage + randomInt(3500, 7000);
      vehicle.status = VEHICLE_STATUS.AVAILABLE;
    }
  });
}

function stripSeedMetadata(rentals) {
  return rentals.map(({ _department, ...rental }) => rental);
}

function countBy(items, factory) {
  return items.reduce((result, item) => {
    const key = factory(item);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function validateDataset({
  users,
  vehicles,
  rentals,
  histories,
}) {
  const errors = [];

  const commonUsers = users.filter(
    (user) => user.role === USER_ROLE.USER
  );
  const admins = users.filter(
    (user) => user.role === USER_ROLE.ADMIN
  );

  if (commonUsers.length !== COMMON_USERS) {
    errors.push(
      `Usuários comuns: esperado ${COMMON_USERS}, recebido ${commonUsers.length}.`
    );
  }

  if (admins.length !== ADMIN_USERS) {
    errors.push(
      `Administradores: esperado ${ADMIN_USERS}, recebido ${admins.length}.`
    );
  }

  if (vehicles.length !== VEHICLE_COUNT) {
    errors.push(
      `Veículos: esperado ${VEHICLE_COUNT}, recebido ${vehicles.length}.`
    );
  }

  if (rentals.length !== RENTAL_COUNT) {
    errors.push(
      `Reservas: esperado ${RENTAL_COUNT}, recebido ${rentals.length}.`
    );
  }

  const statusCounts = countBy(rentals, (rental) => rental.status);

  for (const [status, expected] of Object.entries(STATUS_TARGETS)) {
    if (statusCounts[status] !== expected) {
      errors.push(
        `Status ${status}: esperado ${expected}, recebido ${statusCounts[status] || 0}.`
      );
    }
  }

  if (histories.length !== STATUS_TARGETS.completed) {
    errors.push(
      `Histórico de quilometragem: esperado ${STATUS_TARGETS.completed}, recebido ${histories.length}.`
    );
  }

  const monthlyCounts = countBy(
    rentals,
    (rental) => rental.startDate.getUTCMonth()
  );

  MONTHLY_TOTALS.forEach((expected, monthIndex) => {
    if (monthlyCounts[monthIndex] !== expected) {
      errors.push(
        `Mês ${monthIndex + 1}: esperado ${expected}, recebido ${monthlyCounts[monthIndex] || 0}.`
      );
    }
  });

  histories.forEach((history) => {
    if (history.newMileage <= history.previousMileage) {
      errors.push(
        `Histórico ${history._id} não possui quilometragem crescente.`
      );
    }
  });

  if (errors.length > 0) {
    throw new Error(
      `Dataset anual inválido:\n- ${errors.join('\n- ')}`
    );
  }

  return {
    statusCounts,
    monthlyCounts,
    totalMileage: histories.reduce(
      (sum, history) =>
        sum + (history.newMileage - history.previousMileage),
      0
    ),
  };
}

async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'A seed anual não pode ser executada com NODE_ENV=production.'
    );
  }

  if (process.env.ALLOW_DEMO_DATA_RESET !== 'true') {
    throw new Error(
      'Defina ALLOW_DEMO_DATA_RESET=true para confirmar a limpeza da base de demonstração.'
    );
  }

  const databaseName = String(mongoose.connection.name || '').toLowerCase();

  if (
    databaseName.includes('prod') ||
    databaseName.includes('production')
  ) {
    throw new Error(
      `A base "${mongoose.connection.name}" parece ser de produção. Operação cancelada.`
    );
  }

  await VehicleMileageHistory.deleteMany({});
  await RentalRequest.deleteMany({});
  await Vehicle.deleteMany({});
  await User.deleteMany({});
}

function buildDataset(passwordHash) {
  const { users, commonUsersByDepartment } =
    buildUsers(passwordHash);
  const vehicleSeed = buildVehicles();
  const vehicleConfigs = vehicleSeed.map((entry) => entry.config);
  const vehicleDocuments = vehicleSeed.map((entry) => entry.document);
  const slotPools = buildSlotPools(vehicleConfigs);
  const departmentPool = buildDepartmentPool();
  const { openStatuses, closedStatuses } = buildStatusPools();

  const rentals = [];
  let closedCursor = 0;
  let rentalIndex = 0;

  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const openCount =
      monthIndex === 11 ? openStatuses.length : 0;
    const closedCount = MONTHLY_TOTALS[monthIndex] - openCount;

    const monthStatuses = [
      ...(monthIndex === 11 ? openStatuses : []),
      ...closedStatuses.slice(
        closedCursor,
        closedCursor + closedCount
      ),
    ];

    closedCursor += closedCount;

    for (const status of monthStatuses) {
      const department = departmentPool[rentalIndex];
      const user = pickUser(
        commonUsersByDepartment,
        department
      );
      const restrictLateDecember =
        monthIndex === 11 &&
        [
          RENTAL_STATUS.PENDING,
          RENTAL_STATUS.APPROVED,
          RENTAL_STATUS.RETURN_PENDING,
        ].includes(status);

      const slot = takeSlot({
        monthIndex,
        department,
        restrictLateDecember,
        slotPools,
        vehicleConfigs,
      });

      rentals.push(
        buildRental({
          index: rentalIndex,
          status,
          department,
          user,
          slot,
        })
      );

      rentalIndex += 1;
    }
  }

  const histories = applyCompletedMileage({
    rentals,
    vehicleDocuments,
    vehicleConfigs,
  });

  applyMaintenanceScenario(vehicleDocuments);

  const cleanRentals = stripSeedMetadata(rentals);
  const validation = validateDataset({
    users,
    vehicles: vehicleDocuments,
    rentals: cleanRentals,
    histories,
  });

  return {
    users,
    vehicles: vehicleDocuments,
    rentals: cleanRentals,
    histories,
    validation,
  };
}

function printSummary(dataset) {
  const { statusCounts, totalMileage } = dataset.validation;

  console.log('');
  console.log('Fleet annual presentation dataset');
  console.log('---------------------------------');
  console.log(`Ano: ${YEAR}`);
  console.log(`Empresa simulada: ${COMPANY_EMPLOYEES} funcionários`);
  console.log(
    `Usuários do sistema: ${COMMON_USERS + ADMIN_USERS} (${COMMON_USERS} usuários + ${ADMIN_USERS} administradores)`
  );
  console.log(`Veículos originais preservados: ${dataset.vehicles.length}`);
  console.log(`Reservas: ${dataset.rentals.length}`);
  console.log(`Históricos de quilometragem: ${dataset.histories.length}`);
  console.log(`Quilometragem gerada: ${totalMileage.toLocaleString('pt-BR')} km`);
  console.log('');
  console.log('Status:');

  Object.entries(statusCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([status, count]) => {
      console.log(`- ${status}: ${count}`);
    });

  console.log('');
  console.log('Distribuição mensal:');

  MONTHLY_TOTALS.forEach((count, monthIndex) => {
    console.log(
      `- ${String(monthIndex + 1).padStart(2, '0')}/${YEAR}: ${count}`
    );
  });

  console.log('');
  console.log(
    'Aviso: dados demonstrativos simulados para representar o fechamento anual de uma empresa com 1.000 funcionários.'
  );
}

async function closeConnectionSafely() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

async function run() {
  try {
    if (!Number.isInteger(YEAR) || YEAR < 2000 || YEAR > 2100) {
      throw new Error('ANNUAL_SEED_YEAR deve ser um ano válido.');
    }

    const passwordHash = DRY_RUN
      ? '$2a$10$annualSeedDryRunHash'
      : await bcrypt.hash(DEMO_PASSWORD, BCRYPT_SALT_ROUNDS);

    const dataset = buildDataset(passwordHash);
    printSummary(dataset);

    if (DRY_RUN) {
      console.log('');
      console.log('Dry run concluído. Nenhum dado foi alterado.');
      return;
    }

    if (!process.env.MONGODB_URI) {
      throw new Error(
        'MONGODB_URI não encontrada no arquivo backend/.env.'
      );
    }

    await connectDatabase();
    await resetDatabase();

    await User.insertMany(dataset.users, { ordered: true });
    await Vehicle.insertMany(dataset.vehicles, { ordered: true });
    await RentalRequest.insertMany(dataset.rentals, {
      ordered: true,
    });
    await VehicleMileageHistory.insertMany(dataset.histories, {
      ordered: true,
    });

    console.log('');
    console.log('Seed anual concluída com sucesso.');
    console.log(
      `Admin demo: ${ADMIN_SEED[0][1]} / ${DEMO_PASSWORD}`
    );
  } catch (error) {
    console.error('');
    console.error('Seed anual falhou:', error.message);
    process.exitCode = 1;
  } finally {
    await closeConnectionSafely();
  }
}

run();
