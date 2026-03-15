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
      // NOTE: stores a reference to avoid a duplicated user snapshot on every rental.
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      // NOTE: the Vehicle document remains the single source of truth for vehicle data.
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
      // NOTE: cancelled was added to close the reservation lifecycle on user or admin abort.
      // NOTE: return_pending separates the user's return request from the admin's final confirmation.
      // NOTE: completed represents the real operational closure of a reservation.
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
      // TODO: if audit grows, split into distinct fields: approvalNotes, rejectionNotes, cancelNotes, completionNotes.
    },

    returnRequestedMileage: {
      type: Number,
      min: 0,
      // NOTE: mileage reported by the user when requesting the return.
      // NOTE: consistency with the vehicle's current mileage is validated in the service layer.
    },

    returnRequestedAt: {
      type: Date,
      // NOTE: timestamp of the moment the user submits the return for administrative review.
    },

    returnNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
      // NOTE: optional comment submitted by the user alongside the return request.
    },

    actualMileage: {
      type: Number,
      min: 0,
      // NOTE: consolidated mileage recorded after admin acceptance and reservation completion.
    },

    completedAt: {
      type: Date,
      // NOTE: timestamp of the final administrative closure of the return.
    },

    completionNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
      // NOTE: final admin observation recorded when confirming the return.
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// NOTE: this compound index optimises conflict queries by vehicle + date range.
rentalRequestSchema.index({ vehicle: 1, startDate: 1, endDate: 1 });

module.exports = {
  RentalRequest: mongoose.model('RentalRequest', rentalRequestSchema),
  RENTAL_STATUS,
};