const express = require('express');
const validate = require('../middleware/validate');
const rentalController = require('../controllers/rentalController');

const {
  createRequestSchema,
  adminDecisionSchema,
  listRequestsQuerySchema,
} = require('../validators/rentalValidator');

const router = express.Router();

router.get('/', validate(listRequestsQuerySchema, 'query'), rentalController.listRequests);

router.post('/', validate(createRequestSchema), rentalController.createRequest);

router.patch('/:id/approve', validate(adminDecisionSchema), rentalController.approveRequest);

router.patch('/:id/reject', validate(adminDecisionSchema), rentalController.rejectRequest);

module.exports = router;