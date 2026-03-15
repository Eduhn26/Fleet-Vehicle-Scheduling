/*
ENGINEERING NOTE:
Service-level suite for rental business rules. It validates lifecycle
transitions directly without HTTP transport noise.
*/
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
const { VehicleMileageHistory } = require('../../src/models/VehicleMileageHistory');

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

  describe('requestReturn', () => {
    it('moves an approved rental to return_pending and stores requested mileage', async () => {
      const user = await User.create(buildUserPayload({ role: USER_ROLE.USER }));
      const vehicle = await Vehicle.create(buildVehiclePayload({ mileage: 4500 }));

      const created = await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate: buildFutureDate(10),
        endDate: buildFutureDate(12),
        purpose: 'Teste request return',
      });

      await rentalService.approveRequest({
        requestId: created.id,
        adminNotes: 'Aprovado para devolução',
      });

      const updated = await rentalService.requestReturn({
        requestId: created.id,
        userId: user._id.toString(),
        mileage: 4800,
        returnNotes: 'Retorno sem avarias',
      });

      expect(updated.status).toBe(RENTAL_STATUS.RETURN_PENDING);
      expect(updated.returnRequestedMileage).toBe(4800);
      expect(updated.returnNotes).toBe('Retorno sem avarias');

      const persisted = await RentalRequest.findById(created.id);
      expect(persisted.status).toBe(RENTAL_STATUS.RETURN_PENDING);
      expect(persisted.returnRequestedMileage).toBe(4800);
      expect(persisted.returnRequestedAt).toBeTruthy();
    });

    it('blocks return request with mileage lower than current vehicle mileage', async () => {
      const user = await User.create(buildUserPayload({ role: USER_ROLE.USER }));
      const vehicle = await Vehicle.create(buildVehiclePayload({ mileage: 4500 }));

      const created = await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate: buildFutureDate(10),
        endDate: buildFutureDate(12),
        purpose: 'Teste km inválido',
      });

      await rentalService.approveRequest({
        requestId: created.id,
        adminNotes: 'Aprovado para teste',
      });

      await expectAppError(
        rentalService.requestReturn({
          requestId: created.id,
          userId: user._id.toString(),
          mileage: 4400,
          returnNotes: 'KM inválido',
        }),
        {
          statusCode: 409,
        }
      );
    });
  });

  describe('completeRental', () => {
    it('completes the rental, updates vehicle mileage and writes mileage history', async () => {
      const user = await User.create(buildUserPayload({ role: USER_ROLE.USER }));
      const vehicle = await Vehicle.create(
        buildVehiclePayload({
          mileage: 4500,
          nextMaintenance: 30000,
          lastMaintenanceMileage: 0,
        })
      );

      const created = await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate: buildFutureDate(10),
        endDate: buildFutureDate(12),
        purpose: 'Teste complete rental',
      });

      await rentalService.approveRequest({
        requestId: created.id,
        adminNotes: 'Aprovado para conclusão',
      });

      await rentalService.requestReturn({
        requestId: created.id,
        userId: user._id.toString(),
        mileage: 4900,
        returnNotes: 'Solicitando conclusão',
      });

      const completed = await rentalService.completeRental({
        requestId: created.id,
        adminNotes: 'Concluído pelo admin',
      });

      expect(completed.status).toBe(RENTAL_STATUS.COMPLETED);
      expect(completed.actualMileage).toBe(4900);

      const persistedRental = await RentalRequest.findById(created.id);
      expect(persistedRental.status).toBe(RENTAL_STATUS.COMPLETED);
      expect(persistedRental.actualMileage).toBe(4900);
      expect(persistedRental.completedAt).toBeTruthy();

      const updatedVehicle = await Vehicle.findById(vehicle._id);
      expect(updatedVehicle.mileage).toBe(4900);
      expect(updatedVehicle.status).toBe(VEHICLE_STATUS.AVAILABLE);

      const history = await VehicleMileageHistory.findOne({
        rental: created.id,
        vehicle: vehicle._id,
      });

      expect(history).not.toBeNull();
      expect(history.previousMileage).toBe(4500);
      expect(history.newMileage).toBe(4900);
    });

    it('moves vehicle to maintenance when returned mileage reaches maintenance threshold', async () => {
      const user = await User.create(buildUserPayload({ role: USER_ROLE.USER }));
      const vehicle = await Vehicle.create(
        buildVehiclePayload({
          mileage: 29500,
          nextMaintenance: 30000,
          lastMaintenanceMileage: 0,
        })
      );

      const created = await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate: buildFutureDate(10),
        endDate: buildFutureDate(12),
        purpose: 'Teste manutenção automática',
      });

      await rentalService.approveRequest({
        requestId: created.id,
        adminNotes: 'Aprovado para manutenção',
      });

      await rentalService.requestReturn({
        requestId: created.id,
        userId: user._id.toString(),
        mileage: 30000,
        returnNotes: 'Bateu threshold',
      });

      const completed = await rentalService.completeRental({
        requestId: created.id,
        adminNotes: 'Concluído e enviado para manutenção',
      });

      expect(completed.status).toBe(RENTAL_STATUS.COMPLETED);

      const updatedVehicle = await Vehicle.findById(vehicle._id);
      expect(updatedVehicle.mileage).toBe(30000);
      expect(updatedVehicle.status).toBe(VEHICLE_STATUS.MAINTENANCE);
    });

    it('blocks completion when rental is not in return_pending', async () => {
      const user = await User.create(buildUserPayload({ role: USER_ROLE.USER }));
      const vehicle = await Vehicle.create(buildVehiclePayload());

      const created = await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate: buildFutureDate(10),
        endDate: buildFutureDate(12),
        purpose: 'Teste conclusão inválida',
      });

      await rentalService.approveRequest({
        requestId: created.id,
        adminNotes: 'Aprovado sem return',
      });

      await expectAppError(
        rentalService.completeRental({
          requestId: created.id,
          adminNotes: 'Tentativa inválida',
        }),
        {
          statusCode: 409,
        }
      );
    });
  });
});