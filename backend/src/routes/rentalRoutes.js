const express = require('express');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const rentalController = require('../controllers/rentalController');

const {
  createRequestSchema,
  adminDecisionSchema,
  cancelRequestSchema,
  listRequestsQuerySchema,
  requestReturnSchema,
} = require('../validators/rentalValidator');

const router = express.Router();

router.get(
  '/',
  auth,
  requireRole('admin'),
  validate(listRequestsQuerySchema, 'query'),
  // SEC: global listing exposes data for all requests and must remain restricted to admin.
  rentalController.listRequests
);

router.get('/my', auth, rentalController.listMyRequests);

router.post(
  '/',
  auth,
  validate(createRequestSchema),
  rentalController.createRequest
);

router.patch(
  '/:id/approve',
  auth,
  requireRole('admin'),
  validate(adminDecisionSchema),
  rentalController.approveRequest
);

router.patch(
  '/:id/reject',
  auth,
  requireRole('admin'),
  validate(adminDecisionSchema),
  rentalController.rejectRequest
);

router.patch(
  '/:id/cancel',
  auth,
  validate(cancelRequestSchema),
  rentalController.cancelRequest
);

router.patch(
  '/:id/request-return',
  auth,
  validate(requestReturnSchema),
  // NOTE: the user only requests the return; final closure still depends on admin confirmation.
  rentalController.requestReturn
);

router.patch(
  '/:id/complete',
  auth,
  requireRole('admin'),
  validate(adminDecisionSchema),
  // NOTE: the return becomes an operational closure only after admin acceptance.
  rentalController.completeRental
);

module.exports = router;