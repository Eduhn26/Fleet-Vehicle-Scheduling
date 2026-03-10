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
  // SEC: listagem global expõe dados de todas as requests; precisa ficar restrita a admin.
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
  // NOTE: o user só solicita devolução; a conclusão final continua dependendo do admin.
  rentalController.requestReturn
);

router.patch(
  '/:id/complete',
  auth,
  requireRole('admin'),
  validate(adminDecisionSchema),
  // NOTE: a devolução só vira conclusão operacional após aceite do admin.
  rentalController.completeRental
);

module.exports = router;