process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');
const { User, USER_ROLE } = require('../../src/models/User');
const {
  Vehicle,
  VEHICLE_STATUS,
  TRANSMISSION_TYPE,
  FUEL_TYPE,
} = require('../../src/models/Vehicle');
const { RentalRequest, RENTAL_STATUS } = require('../../src/models/RentalRequest');
const { VehicleMileageHistory } = require('../../src/models/VehicleMileageHistory');

const buildFutureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

const buildUserPayload = (overrides = {}) => ({
  name: 'Eduardo Henrique',
  email: 'eduardo.dev@example.com',
  password: '123456',
  role: USER_ROLE.USER,
  department: 'TI',
  registrationId: 'USR001',
  ...overrides,
});

const buildVehiclePayload = (overrides = {}) => ({
  brand: 'Jeep',
  model: 'Compass',
  year: 2024,
  licensePlate: 'JEE5P67',
  color: 'Branco',
  mileage: 4500,
  status: VEHICLE_STATUS.AVAILABLE,
  transmissionType: TRANSMISSION_TYPE.AUTOMATIC,
  fuelType: FUEL_TYPE.FLEX,
  passengers: 5,
  nextMaintenance: 30000,
  lastMaintenanceMileage: 0,
  ...overrides,
});

const makeToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

describe('rentalRoutes HTTP', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri(), {
      dbName: 'fleet-vehicle-scheduling-http-tests',
    });
  });

  afterEach(async () => {
    await Promise.all([
      VehicleMileageHistory.deleteMany({}),
      RentalRequest.deleteMany({}),
      User.deleteMany({}),
      Vehicle.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('POST /api/rentals', () => {
    it('returns 401 when token is missing', async () => {
      const vehicle = await Vehicle.create(buildVehiclePayload());

      const response = await request(app).post('/api/rentals').send({
        vehicleId: vehicle._id.toString(),
        startDate: buildFutureDate(10),
        endDate: buildFutureDate(12),
        purpose: 'Reserva sem token',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBeTruthy();
    });

    it('creates a pending rental for an authenticated user', async () => {
      const user = await User.create(buildUserPayload());
      const vehicle = await Vehicle.create(buildVehiclePayload());
      const token = makeToken(user);

      const response = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehicleId: vehicle._id.toString(),
          startDate: buildFutureDate(10),
          endDate: buildFutureDate(12),
          purpose: 'Viagem corporativa',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toBeTruthy();
      expect(response.body.data.status).toBe(RENTAL_STATUS.PENDING);
      expect(response.body.data.user.id).toBe(user._id.toString());
      expect(response.body.data.vehicle.id).toBe(vehicle._id.toString());

      const persisted = await RentalRequest.findById(response.body.data.id);
      expect(persisted).not.toBeNull();
      expect(persisted.status).toBe(RENTAL_STATUS.PENDING);
    });

    it('returns 422 for invalid payload', async () => {
      const user = await User.create(buildUserPayload());
      const vehicle = await Vehicle.create(buildVehiclePayload());
      const token = makeToken(user);

      const response = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vehicleId: vehicle._id.toString(),
          startDate: buildFutureDate(10),
          endDate: buildFutureDate(12),
          purpose: 'ok',
        });

      expect(response.status).toBe(422);
      expect(response.body.error.message).toBe('Payload inválido');
      expect(Array.isArray(response.body.error.details)).toBe(true);
      expect(response.body.error.details.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/rentals/:id/approve', () => {
    it('allows admin to approve a pending rental', async () => {
      const admin = await User.create(
        buildUserPayload({
          name: 'Admin',
          email: 'admin@test.com',
          role: USER_ROLE.ADMIN,
          registrationId: 'ADM001',
        })
      );

      const user = await User.create(
        buildUserPayload({
          name: 'User',
          email: 'user@test.com',
          role: USER_ROLE.USER,
          registrationId: 'USR002',
        })
      );

      const vehicle = await Vehicle.create(buildVehiclePayload());
      const adminToken = makeToken(admin);

      const created = await RentalRequest.create({
        user: user._id,
        vehicle: vehicle._id,
        startDate: new Date(`${buildFutureDate(10)}T00:00:00.000Z`),
        endDate: new Date(`${buildFutureDate(12)}T00:00:00.000Z`),
        purpose: 'Reserva pendente',
        status: RENTAL_STATUS.PENDING,
      });

      const response = await request(app)
        .patch(`/api/rentals/${created._id.toString()}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminNotes: 'Aprovado pelo admin',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(RENTAL_STATUS.APPROVED);

      const updated = await RentalRequest.findById(created._id);
      expect(updated.status).toBe(RENTAL_STATUS.APPROVED);
    });

    it('returns 403 when a non-admin tries to approve', async () => {
      const user = await User.create(buildUserPayload());
      const otherUser = await User.create(
        buildUserPayload({
          name: 'Outro User',
          email: 'other@test.com',
          registrationId: 'USR003',
        })
      );

      const vehicle = await Vehicle.create(buildVehiclePayload());
      const token = makeToken(user);

      const created = await RentalRequest.create({
        user: otherUser._id,
        vehicle: vehicle._id,
        startDate: new Date(`${buildFutureDate(10)}T00:00:00.000Z`),
        endDate: new Date(`${buildFutureDate(12)}T00:00:00.000Z`),
        purpose: 'Reserva pendente',
        status: RENTAL_STATUS.PENDING,
      });

      const response = await request(app)
        .patch(`/api/rentals/${created._id.toString()}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          adminNotes: 'Tentativa indevida',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toBe('Acesso negado');

      const persisted = await RentalRequest.findById(created._id);
      expect(persisted.status).toBe(RENTAL_STATUS.PENDING);
    });
  });

  describe('PATCH /api/rentals/:id/cancel', () => {
    it('allows the owner to cancel the rental', async () => {
      const user = await User.create(buildUserPayload());
      const vehicle = await Vehicle.create(buildVehiclePayload());
      const token = makeToken(user);

      const created = await RentalRequest.create({
        user: user._id,
        vehicle: vehicle._id,
        startDate: new Date(`${buildFutureDate(10)}T00:00:00.000Z`),
        endDate: new Date(`${buildFutureDate(12)}T00:00:00.000Z`),
        purpose: 'Reserva para cancelar',
        status: RENTAL_STATUS.APPROVED,
      });

      const response = await request(app)
        .patch(`/api/rentals/${created._id.toString()}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          cancelNotes: 'Cancelando via HTTP test',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(RENTAL_STATUS.CANCELLED);

      const updated = await RentalRequest.findById(created._id);
      expect(updated.status).toBe(RENTAL_STATUS.CANCELLED);
    });
  });
});