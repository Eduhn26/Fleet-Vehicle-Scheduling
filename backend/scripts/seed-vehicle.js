require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const { Vehicle, VEHICLE_STATUS, TRANSMISSION_TYPE, FUEL_TYPE } = require('../src/models/Vehicle');

const run = async () => {
  try {
    await connectDatabase();

    // NOTE: garante um seed idempotente pelo campo unique (licensePlate).
    const payload = {
      brand: 'Toyota',
      model: 'Corolla',
      year: 2022,
      licensePlate: 'ABC1D23',
      color: 'Prata',
      mileage: 45210,
      status: VEHICLE_STATUS.AVAILABLE,
      transmissionType: TRANSMISSION_TYPE.AUTOMATIC,
      fuelType: FUEL_TYPE.FLEX,
      passengers: 5,
      nextMaintenance: 50000,
      lastMaintenanceMileage: 40000,
    };

    const vehicle = await Vehicle.findOneAndUpdate(
      { licensePlate: payload.licensePlate },
      { $set: payload },
      { new: true, upsert: true, runValidators: true }
    );

    console.log('✅ Vehicle upserted:', {
      id: vehicle._id.toString(),
      brand: vehicle.brand,
      model: vehicle.model,
      licensePlate: vehicle.licensePlate,
      status: vehicle.status,
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
};

run();