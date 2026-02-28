require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');

const { User } = require('../src/models/User');
const { Vehicle } = require('../src/models/Vehicle');
const { RentalRequest, RENTAL_STATUS } = require('../src/models/RentalRequest');

const run = async () => {
  try {
    await connectDatabase();

    const user = await User.findOne({ email: 'eduardo.dev@example.com' });
    const vehicle = await Vehicle.findOne({ licensePlate: 'ABC1D23' });

    if (!user || !vehicle) {
      throw new Error('User ou Vehicle não encontrados. Rode os seeds anteriores.');
    }

    const payload = {
      user: user._id,
      vehicle: vehicle._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 dias
      purpose: 'Viagem corporativa',
      status: RENTAL_STATUS.PENDING,
    };

    const rental = await RentalRequest.create(payload);

    console.log('✅ RentalRequest created:', {
      id: rental._id.toString(),
      user: user.email,
      vehicle: vehicle.licensePlate,
      status: rental.status,
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed rental failed:', error);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
};

run();