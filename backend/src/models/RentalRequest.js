const mongoose = require('mongoose');

const RENTAL_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
});

const rentalRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // NOTE: mantemos referência ao usuário para evitar snapshot duplicado.
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      // NOTE: a fonte da verdade do veículo continua sendo o documento Vehicle.
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
      // NOTE: cancelled entra na Fase 6 para fechar o lifecycle da reserva.
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
      // TODO: se a auditoria crescer, separar em campos distintos: approvalNotes, rejectionNotes, cancelNotes.
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// NOTE: este índice favorece as consultas de conflito por veículo + período.
rentalRequestSchema.index({ vehicle: 1, startDate: 1, endDate: 1 });

module.exports = {
  RentalRequest: mongoose.model('RentalRequest', rentalRequestSchema),
  RENTAL_STATUS,
};