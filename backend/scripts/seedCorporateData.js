require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../src/models/User");
const Vehicle = require("../src/models/Vehicle");
const RentalRequest = require("../src/models/RentalRequest");

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomDateLast90Days = () => {
  const now = new Date();
  const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log("Connected to MongoDB");

  const password = await bcrypt.hash("123456", 10);

  const users = [
    {
      name: "Eduardo Henrique",
      email: "admin@empresa.com",
      role: "admin",
      password
    },
    {
      name: "João Silva",
      email: "joao.silva@empresa.com",
      role: "user",
      password
    },
    {
      name: "Juliana Martins",
      email: "juliana.martins@empresa.com",
      role: "user",
      password
    },
    {
      name: "Camila Costa",
      email: "camila.costa@empresa.com",
      role: "user",
      password
    },
    {
      name: "Roberto Alves",
      email: "roberto.alves@empresa.com",
      role: "user",
      password
    },
    {
      name: "Maria Souza",
      email: "maria.souza@empresa.com",
      role: "user",
      password
    },
    {
      name: "Felipe Rocha",
      email: "felipe.rocha@empresa.com",
      role: "user",
      password
    }
  ];

  const createdUsers = [];

  for (const u of users) {
    const user = await User.findOneAndUpdate(
      { email: u.email },
      u,
      { new: true, upsert: true }
    );

    createdUsers.push(user);
  }

  const vehicles = await Vehicle.find();

  if (vehicles.length === 0) {
    console.log("No vehicles found");
    process.exit();
  }

  console.log(`Vehicles available: ${vehicles.length}`);

  await RentalRequest.deleteMany({});

  const motives = [
    "Visita a cliente estratégico",
    "Reunião com fornecedor",
    "Treinamento na filial",
    "Auditoria operacional externa",
    "Entrega de documentação",
    "Suporte técnico em cliente",
    "Inspeção de unidade regional",
    "Reunião comercial",
    "Visita técnica de manutenção",
    "Apresentação de projeto"
  ];

  const statuses = [
    "approved",
    "rejected",
    "pending",
    "completed",
    "cancelled"
  ];

  const requests = [];

  for (let i = 0; i < 30; i++) {
    const user = random(createdUsers.filter(u => u.role === "user"));
    const vehicle = random(vehicles);

    const start = randomDateLast90Days();
    const end = addDays(start, Math.floor(Math.random() * 3) + 1);

    const status = random(statuses);

    const request = {
      user: user._id,
      vehicle: vehicle._id,
      startDate: start,
      endDate: end,
      reason: random(motives),
      status
    };

    if (status === "approved") {
      request.approvedAt = addDays(start, -1);
    }

    if (status === "completed") {
      request.approvedAt = addDays(start, -1);
      request.completedAt = end;
    }

    if (status === "rejected") {
      request.rejectedAt = addDays(start, -1);
    }

    if (status === "cancelled") {
      request.cancelledAt = addDays(start, -1);
    }

    requests.push(request);
  }

  await RentalRequest.insertMany(requests);

  console.log("Corporate demo data created");

  console.log(`
Demo users:

Admin
admin@empresa.com
123456

Users
joao.silva@empresa.com
juliana.martins@empresa.com
camila.costa@empresa.com
roberto.alves@empresa.com
maria.souza@empresa.com
felipe.rocha@empresa.com

Password for all users:
123456
`);

  process.exit();
}

seed();