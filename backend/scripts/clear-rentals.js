require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const { Rental } = require('../src/models/Rental');

async function run() {
  try {
    await connectDatabase();

    await Rental.deleteMany({});

    console.log('🧹 All rentals removed');

    await mongoose.connection.close();
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();