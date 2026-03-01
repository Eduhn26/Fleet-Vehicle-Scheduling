const { z } = require('zod');

const yyyyMmDd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar no formato YYYY-MM-DD');

const objectIdLike = z.string().trim().min(1);

const createRequestSchema = z.object({
  userId: objectIdLike,
  vehicleId: objectIdLike,
  startDate: yyyyMmDd,
  endDate: yyyyMmDd,
  purpose: z.string().trim().min(3, 'purpose muito curto').max(300, 'purpose muito longo'),
});

const adminDecisionSchema = z.object({
  adminNotes: z.string().trim().max(500).optional().default(''),
});

const listRequestsQuerySchema = z.object({
  status: z.string().trim().optional(),
});

module.exports = {
  createRequestSchema,
  adminDecisionSchema,
  listRequestsQuerySchema,
};