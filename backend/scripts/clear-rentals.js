require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const { Rental } = require('../src/models/Rental');

/*
ENGINEERING NOTE:
Utility script used during development to clear all rental documents
from the database. This is typically used to reset the environment
before running demo seeds or integration tests.

SEC:
Do not execute against production environments.
*/

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