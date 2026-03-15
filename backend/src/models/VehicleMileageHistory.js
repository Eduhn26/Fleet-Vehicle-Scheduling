const mongoose = require('mongoose');

/*
ENGINEERING NOTE:
This model records immutable mileage transitions created when a rental
return is officially completed. It exists as an audit trail so vehicle
mileage updates can be traced back to a specific rental flow.
*/
const vehicleMileageHistorySchema = new mongoose.Schema(
  {
    // NOTE: Vehicle that had its mileage changed during return confirmation.
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },

    // NOTE: Rental flow that originated this mileage transition.
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalRequest',
      required: true,
    },

    // NOTE: Vehicle mileage before the confirmed return was applied.
    previousMileage: {
      type: Number,
      required: true,
      min: 0,
    },

    // NOTE: Vehicle mileage after the confirmed return was applied.
    newMileage: {
      type: Number,
      required: true,
      min: 0,
    },

    // NOTE: Explicit business timestamp kept even with schema timestamps enabled.
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