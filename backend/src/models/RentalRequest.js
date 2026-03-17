const mongoose = require('mongoose');

const RENTAL_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  RETURN_PENDING: 'return_pending',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
});

const rentalRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },

    // NOTE: startDate and endDate now store full datetime (date + time).
    // Stored in UTC. The "date only" granularity of the previous version
    // is replaced by datetime granularity so two reservations can share
    // the same calendar day without conflicting — e.g. 08:00–12:00 and
    // 13:00–17:00 on the same vehicle are both valid.
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 300,
    },

    status: {
      type: String,
      enum: Object.values(RENTAL_STATUS),
      default: RENTAL_STATUS.PENDING,
      required: true,
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    returnRequestedMileage: {
      type: Number,
      min: 0,
    },

    returnRequestedAt: {
      type: Date,
    },

    returnNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    actualMileage: {
      type: Number,
      min: 0,
    },

    completedAt: {
      type: Date,
    },

    completionNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// NOTE: compound index on vehicle + datetime range optimises conflict queries.
rentalRequestSchema.index({ vehicle: 1, startDate: 1, endDate: 1 });

module.exports = {
  RentalRequest: mongoose.model('RentalRequest', rentalRequestSchema),
  RENTAL_STATUS,
};