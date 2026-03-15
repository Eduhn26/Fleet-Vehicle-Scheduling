const mongoose = require('mongoose');

const VEHICLE_STATUS = Object.freeze({
  AVAILABLE: 'available',
  MAINTENANCE: 'maintenance',
});

const TRANSMISSION_TYPE = Object.freeze({
  MANUAL: 'manual',
  AUTOMATIC: 'automatic',
});

const FUEL_TYPE = Object.freeze({
  GASOLINE: 'gasoline',
  ETHANOL: 'ethanol',
  FLEX: 'flex',
  DIESEL: 'diesel',
  ELECTRIC: 'electric',
  HYBRID: 'hybrid',
});

const vehicleSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
      // NOTE: allows next-year models — standard practice in the automotive market.
    },

    licensePlate: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 5,
      maxlength: 10,
      // NOTE: lightweight validation only. Definitive format rules and normalization live in the Service.
    },

    color: {
      type: String,
      required: true,
      trim: true,
    },

    mileage: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      required: true,
      enum: Object.values(VEHICLE_STATUS),
      default: VEHICLE_STATUS.AVAILABLE,
    },

    transmissionType: {
      type: String,
      required: true,
      enum: Object.values(TRANSMISSION_TYPE),
    },

    fuelType: {
      type: String,
      required: true,
      enum: Object.values(FUEL_TYPE),
    },

    passengers: {
      type: Number,
      required: true,
      min: 1,
      max: 15,
    },

    nextMaintenance: {
      type: Number,
      required: true,
      min: 0,
      // NOTE: this is data, not a rule. The logic for when to trigger maintenance lives in the Service.
    },

    lastMaintenanceMileage: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    imageUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
      // NOTE: optional — the frontend renders a placeholder image when this field is empty.
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = {
  Vehicle: mongoose.model('Vehicle', vehicleSchema),
  VEHICLE_STATUS,
  TRANSMISSION_TYPE,
  FUEL_TYPE,
};