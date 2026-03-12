require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const { Vehicle, VEHICLE_STATUS, TRANSMISSION_TYPE, FUEL_TYPE } = require('../src/models/Vehicle');

const run = async () => {
  try {
    await connectDatabase();

    // 🔥 Remove veículos antigos
    await Vehicle.deleteMany({});
    console.log('🧹 Old vehicles removed');

    const vehicles = [
      {
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
      },
      {
        brand: 'Volkswagen',
        model: 'Polo Highline',
        year: 2023,
        licensePlate: 'POL1H23',
        color: 'Prata',
        mileage: 12000,
        status: VEHICLE_STATUS.AVAILABLE,
        transmissionType: TRANSMISSION_TYPE.AUTOMATIC,
        fuelType: FUEL_TYPE.FLEX,
        passengers: 5,
        nextMaintenance: 30000,
        lastMaintenanceMileage: 0,
      },
      {
        brand: 'Toyota',
        model: 'Yaris',
        year: 2023,
        licensePlate: 'YAR1S23',
        color: 'Azul',
        mileage: 7800,
        status: VEHICLE_STATUS.AVAILABLE,
        transmissionType: TRANSMISSION_TYPE.AUTOMATIC,
        fuelType: FUEL_TYPE.FLEX,
        passengers: 5,
        nextMaintenance: 30000,
        lastMaintenanceMileage: 0,
      },

      {
  brand: "Toyota",
  model: "Etios",
  year: 2022,
  licensePlate: "ETI1234",
  color: "Branco",
  mileage: 15000,
  status: VEHICLE_STATUS.AVAILABLE,
  transmissionType: TRANSMISSION_TYPE.MANUAL,
  fuelType: FUEL_TYPE.FLEX,
  passengers: 5,
  nextMaintenance: 20000,
  lastMaintenanceMileage: 0
},
      {
        brand: 'Honda',
        model: 'HRV',
        year: 2020,
        licensePlate: 'HRV2A20',
        color: 'Chumbo',
        mileage: 10000,
        status: VEHICLE_STATUS.AVAILABLE,
        transmissionType: TRANSMISSION_TYPE.AUTOMATIC,
        fuelType: FUEL_TYPE.FLEX,
        passengers: 5,
        nextMaintenance: 30000,
        lastMaintenanceMileage: 0,
      }
    ];

    const inserted = await Vehicle.insertMany(vehicles);

    console.log(`✅ ${inserted.length} vehicles inserted`);

    inserted.forEach(v => {
      console.log(`🚗 ${v.brand} ${v.model} - ${v.licensePlate}`);
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