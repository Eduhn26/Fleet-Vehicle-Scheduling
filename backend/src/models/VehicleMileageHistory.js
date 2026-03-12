const mongoose = require('mongoose');

const vehicleMileageHistorySchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },

    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalRequest',
      required: true,
    },

    previousMileage: {
      type: Number,
      required: true,
      min: 0,
    },

    newMileage: {
      type: Number,
      required: true,
      min: 0,
    },

    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = {
  VehicleMileageHistory: mongoose.model(
    'VehicleMileageHistory',
    vehicleMileageHistorySchema
  ),
};