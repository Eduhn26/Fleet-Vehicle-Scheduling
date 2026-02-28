require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const rentalService = require('../src/services/rentalService');
const { User } = require('../src/models/User');
const { Vehicle } = require('../src/models/Vehicle');
const { RentalRequest, RENTAL_STATUS } = require('../src/models/RentalRequest');

const run = async () => {
  try {
    await connectDatabase();

    const user = await User.findOne({ email: 'eduardo.dev@example.com' });
    const vehicle = await Vehicle.findOne({ licensePlate: 'ABC1D23' });

    if (!user || !vehicle) {
      throw new Error('User ou Vehicle não encontrados. Rode seed-user e seed-vehicle antes.');
    }

    const startDate = '2026-03-01';
    const endDate = '2026-03-03';

    // NOTE: smoke precisa ser idempotente. Limpamos apenas o cenário deste teste.
    await RentalRequest.deleteMany({
      user: user._id,
      vehicle: vehicle._id,
      startDate: new Date(`${startDate}T00:00:00.000Z`),
      endDate: new Date(`${endDate}T00:00:00.000Z`),
      status: { $in: [RENTAL_STATUS.PENDING, RENTAL_STATUS.APPROVED, RENTAL_STATUS.REJECTED] },
    });

    console.log('🧪 Creating request...');
    const created = await rentalService.createRequest({
      userId: user._id.toString(),
      vehicleId: vehicle._id.toString(),
      startDate,
      endDate,
      purpose: 'Teste de agendamento',
    });

    console.log('✅ Created:', {
      id: created.id,
      status: created.status,
      period: `${created.startDate}..${created.endDate}`,
    });

    console.log('🧪 Creating duplicate (should fail 409)...');
    try {
      await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate,
        endDate,
        purpose: 'Duplicado',
      });
      console.log('❌ Unexpected: duplicate created');
    } catch (err) {
      console.log('✅ Duplicate blocked:', { message: err.message, statusCode: err.statusCode });
    }

    console.log('🧪 Approving request...');
    const approved = await rentalService.approveRequest({
      requestId: created.id,
      adminNotes: 'Aprovado no smoke test',
    });

    console.log('✅ Approved:', { id: approved.id, status: approved.status });

    console.log('🧪 Creating overlapping request (should fail 409)...');
    try {
      await rentalService.createRequest({
        userId: user._id.toString(),
        vehicleId: vehicle._id.toString(),
        startDate: '2026-03-02',
        endDate: '2026-03-04',
        purpose: 'Overlap',
      });
      console.log('❌ Unexpected: overlap created');
    } catch (err) {
      console.log('✅ Overlap blocked:', { message: err.message, statusCode: err.statusCode });
    }

    console.log('🧪 Listing requests...');
    const list = await rentalService.listRequests({});
    console.log('✅ Total requests:', list.length);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Smoke rental failed:', {
      message: error.message,
      statusCode: error.statusCode,
    });

    try {
      await mongoose.connection.close();
    } catch (_) {}

    process.exit(1);
  }
};

run();