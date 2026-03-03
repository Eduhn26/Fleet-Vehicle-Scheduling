const express = require('express');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const rentalController = require('../controllers/rentalController');

const {
  createRequestSchema,
  adminDecisionSchema,
  listRequestsQuerySchema,
} = require('../validators/rentalValidator');

const router = express.Router();

// 🔐 autenticado
router.get(
  '/',
  auth,
  validate(listRequestsQuerySchema, 'query'),
  rentalController.listRequests
);

router.post(
  '/',
  auth,
  validate(createRequestSchema),
  rentalController.createRequest
);

// 🔐 admin only
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

module.exports = router;