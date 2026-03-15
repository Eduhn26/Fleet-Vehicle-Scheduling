const { z } = require('zod');

// NOTE: Transport validation accepts only calendar dates in YYYY-MM-DD
// format to avoid timezone ambiguity during request validation.
const yyyyMmDd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar no formato YYYY-MM-DD');

const createRequestSchema = z.object({
  vehicleId: z.string().trim().min(1, 'vehicleId é obrigatório'),
  startDate: yyyyMmDd,
  endDate: yyyyMmDd,
  purpose: z.string().trim().min(3, 'purpose muito curto').max(300, 'purpose muito longo'),
});

const adminDecisionSchema = z.object({
  adminNotes: z.string().trim().max(500).optional().default(''),
});

/*
ENGINEERING NOTE:
Cancellation notes remain optional because this phase of the system
does not enforce a mandatory business justification for every
cancellation path.
*/
const cancelRequestSchema = z.object({
  // NOTE: Optional justification provided by the user when cancelling a request.
  cancelNotes: z.string().trim().max(500).optional().default(''),
});

const requestReturnSchema = z.object({
  mileage: z
    .number({
      required_error: 'mileage é obrigatório',
      invalid_type_error: 'mileage deve ser um número',
    })
    .min(0, 'mileage não pode ser negativo'),
  returnNotes: z.string().trim().max(500).optional().default(''),
});

const listRequestsQuerySchema = z.object({
  status: z.string().trim().optional(),
});

module.exports = {
  createRequestSchema,
  adminDecisionSchema,
  cancelRequestSchema,
  requestReturnSchema,
  listRequestsQuerySchema,
};