// backend/src/models/RentalRequest.js
const mongoose = require('mongoose');

const RENTAL_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

const rentalRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // NOTE: guardamos referência, não snapshot do usuário.
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      // NOTE: referência mantém fonte da verdade no Vehicle.
    },

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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índice para consultas frequentes por veículo + período
rentalRequestSchema.index({ vehicle: 1, startDate: 1, endDate: 1 });

module.exports = {
  RentalRequest: mongoose.model('RentalRequest', rentalRequestSchema),
  RENTAL_STATUS,
};