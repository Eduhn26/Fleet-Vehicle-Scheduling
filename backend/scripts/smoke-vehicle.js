require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const vehicleService = require('../src/services/vehicleService');

const run = async () => {
  try {
    await connectDatabase();

    // NOTE: smoke test sem HTTP para validar a regra de manutenção antes da Fase 3.
    const plate = 'ABC1D23';

    const before = await vehicleService.findByLicensePlate(plate);
    console.log('🔎 Before:', {
      licensePlate: before.licensePlate,
      mileage: before.mileage,
      nextMaintenance: before.nextMaintenance,
      status: before.status,
    });

    const targetMileage = before.nextMaintenance; // bater exatamente no threshold
    const afterMileage = await vehicleService.updateMileage({
      licensePlate: plate,
      mileage: targetMileage,
    });

    console.log('✅ After updateMileage:', {
      mileage: afterMileage.mileage,
      nextMaintenance: afterMileage.nextMaintenance,
      status: afterMileage.status,
    });

    const forcedAvailable = await vehicleService.setMaintenanceStatus({
      licensePlate: plate,
      status: 'available',
    });

    console.log('✅ After manual override:', {
      status: forcedAvailable.status,
    });

    const next = forcedAvailable.mileage + 5000;
    const recorded = await vehicleService.recordMaintenance({
      licensePlate: plate,
      newNextMaintenance: next,
    });

    console.log('✅ After recordMaintenance:', {
      lastMaintenanceMileage: recorded.lastMaintenanceMileage,
      nextMaintenance: recorded.nextMaintenance,
      status: recorded.status,
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Smoke vehicle failed:', {
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