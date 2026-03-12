const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const rentalService = require('../../src/services/rentalService');
const { User, USER_ROLE } = require('../../src/models/User');
const {
  Vehicle,
  VEHICLE_STATUS,
  TRANSMISSION_TYPE,
  FUEL_TYPE,
} = require('../../src/models/Vehicle');
const { RentalRequest, RENTAL_STATUS } = require('../../src/models/RentalRequest');

const { expectAppError } = require('../helpers/appErrorAssert');

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
  role: USER_ROLE.ADMIN,
  department: 'TI',
  registrationId: 'DEV001',
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

describe('rentalService', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      dbName: 'fleet-vehicle-scheduling-tests',
    });
  });

  afterEach(async () => {
    await Promise.all([
      RentalRequest.deleteMany({}),
      User.deleteMany({}),
      Vehicle.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('createRequest', () => {
    it('creates a pending rental request for a valid future period', async () => {
      const user = await User.create(buildUserPayload());
      const vehicle = await Vehicle.create(buildVehiclePayload());

      const created = await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate: buildFutureDate(10),
        endDate: buildFutureDate(12),
        purpose: 'Viagem corporativa',
      });

      expect(created.status).toBe(RENTAL_STATUS.PENDING);
      expect(created.purpose).toBe('Viagem corporativa');
      expect(created.user.id).toBe(user._id.toString());
      expect(created.vehicle.id).toBe(vehicle._id.toString());

      const persisted = await RentalRequest.findById(created.id);
      expect(persisted).not.toBeNull();
      expect(persisted.status).toBe(RENTAL_STATUS.PENDING);
    });

    it('rejects a period longer than 5 days', async () => {
      const user = await User.create(buildUserPayload());
      const vehicle = await Vehicle.create(buildVehiclePayload());

      await expectAppError(
        rentalService.createRequest({
          userId: user._id.toString(),
          vehicleId: vehicle._id.toString(),
          startDate: buildFutureDate(10),
          endDate: buildFutureDate(15),
          purpose: 'Período inválido',
        }),
        {
          statusCode: 400,
          messageIncludes: 'Período máximo',
        }
      );
    });
  });

  describe('approveRequest', () => {
    it('approves a pending request', async () => {
      const user = await User.create(buildUserPayload());
      const vehicle = await Vehicle.create(buildVehiclePayload());

      const created = await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate: buildFutureDate(10),
        endDate: buildFutureDate(12),
        purpose: 'Teste approve',
      });

      const approved = await rentalService.approveRequest({
        requestId: created.id,
        adminNotes: 'Aprovado no teste',
      });

      expect(approved.status).toBe(RENTAL_STATUS.APPROVED);

      const persisted = await RentalRequest.findById(created.id);
      expect(persisted.status).toBe(RENTAL_STATUS.APPROVED);
    });

    it('blocks conflicting approved reservations for the same vehicle and period', async () => {
      const user = await User.create(buildUserPayload());
      const vehicle = await Vehicle.create(buildVehiclePayload());

      const firstRequest = await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate: buildFutureDate(10),
        endDate: buildFutureDate(12),
        purpose: 'Reserva principal',
      });

      await rentalService.approveRequest({
        requestId: firstRequest.id,
        adminNotes: 'Aprovado para bloquear agenda',
      });

      await expectAppError(
        rentalService.createRequest({
          userId: user._id.toString(),
          vehicleId: vehicle._id.toString(),
          startDate: buildFutureDate(10),
          endDate: buildFutureDate(12),
          purpose: 'Conflito esperado',
        }),
        {
          statusCode: 409,
        }
      );
    });
  });

  describe('cancelRequest', () => {
    it('allows the actor to cancel an approved request', async () => {
      const user = await User.create(buildUserPayload());
      const vehicle = await Vehicle.create(buildVehiclePayload());

      const created = await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate: buildFutureDate(10),
        endDate: buildFutureDate(12),
        purpose: 'Teste cancel',
      });

      await rentalService.approveRequest({
        requestId: created.id,
        adminNotes: 'Vai ser cancelado',
      });

      const cancelled = await rentalService.cancelRequest({
        requestId: created.id,
        actorUserId: user._id.toString(),
        actorRole: user.role,
        cancelNotes: 'Cancelado no teste',
      });

      expect(cancelled.status).toBe(RENTAL_STATUS.CANCELLED);

      const persisted = await RentalRequest.findById(created.id);
      expect(persisted.status).toBe(RENTAL_STATUS.CANCELLED);
    });

    it('blocks duplicate cancellation', async () => {
      const user = await User.create(buildUserPayload());
      const vehicle = await Vehicle.create(buildVehiclePayload());

      const created = await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate: buildFutureDate(10),
        endDate: buildFutureDate(12),
        purpose: 'Teste duplicate cancel',
      });

      await rentalService.cancelRequest({
        requestId: created.id,
        actorUserId: user._id.toString(),
        actorRole: user.role,
        cancelNotes: 'Primeiro cancelamento',
      });

      await expectAppError(
        rentalService.cancelRequest({
          requestId: created.id,
          actorUserId: user._id.toString(),
          actorRole: user.role,
          cancelNotes: 'Segundo cancelamento',
        }),
        {
          statusCode: 400,
        }
      );
    });
  });

  describe('lifecycle protection', () => {
    it('blocks approval after cancellation', async () => {
      const user = await User.create(buildUserPayload());
      const vehicle = await Vehicle.create(buildVehiclePayload());

      const created = await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate: buildFutureDate(10),
        endDate: buildFutureDate(12),
        purpose: 'Lifecycle protection',
      });

      await rentalService.cancelRequest({
        requestId: created.id,
        actorUserId: user._id.toString(),
        actorRole: user.role,
        cancelNotes: 'Cancelado antes do approve',
      });

      await expectAppError(
        rentalService.approveRequest({
          requestId: created.id,
          adminNotes: 'Approve indevido',
        }),
        {
          statusCode: 409,
        }
      );
    });
  });
});