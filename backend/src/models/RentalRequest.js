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
      // NOTE: return_pending entra na Fase 9B para separar solicitação de devolução do aceite administrativo.
      // NOTE: completed passa a representar encerramento operacional real da reserva.
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
      // TODO: se a auditoria crescer, separar em campos distintos: approvalNotes, rejectionNotes, cancelNotes, completionNotes.
    },

    returnRequestedMileage: {
      type: Number,
      min: 0,
      // NOTE: KM informado pelo usuário ao solicitar devolução.
      // NOTE: a consistência com a mileage do veículo continua sendo validada no service.
    },

    returnRequestedAt: {
      type: Date,
      // NOTE: timestamp do momento em que o usuário envia a devolução para análise.
    },

    returnNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
      // NOTE: comentário opcional enviado pelo usuário no pedido de devolução.
    },

    actualMileage: {
      type: Number,
      min: 0,
      // NOTE: quilometragem consolidada após aceite do admin e conclusão da reserva.
    },

    completedAt: {
      type: Date,
      // NOTE: timestamp final da conclusão administrativa da devolução.
    },

    completionNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
      // NOTE: observação final do admin ao concluir a devolução.
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