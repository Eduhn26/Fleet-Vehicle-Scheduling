const { z } = require('zod');

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

const cancelRequestSchema = z.object({
  // NOTE: mantemos opcional porque nem todo cancelamento exige justificativa nesta fase.
  cancelNotes: z.string().trim().max(500).optional().default(''),
});

const listRequestsQuerySchema = z.object({
  status: z.string().trim().optional(),
});

module.exports = {
  createRequestSchema,
  adminDecisionSchema,
  cancelRequestSchema,
  listRequestsQuerySchema,
};