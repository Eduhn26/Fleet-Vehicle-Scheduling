const { z } = require('zod');

// NOTE: Transport now accepts full datetime strings in ISO 8601 local format:
// "YYYY-MM-DDTHH:mm" (no timezone suffix). The service layer is responsible
// for interpreting these as UTC datetimes after pairing them with the
// configured timezone. This keeps the HTTP contract simple and avoids
// browser timezone serialisation issues.
//
// Accepted examples:
//   "2026-03-20T08:00"
//   "2026-03-20T17:30"
//
// Rejected examples:
//   "2026-03-20"          (date only — use the old schema for legacy routes)
//   "2026-03-20T08:00:00Z" (explicit UTC suffix — rejected to enforce consistent input)

const isoLocalDatetime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    'datetime deve estar no formato YYYY-MM-DDTHH:mm'
  );

// Business rule: reservations are slotted in 30-minute increments.
// This prevents oddly-sized gaps between back-to-back reservations.
const SLOT_MINUTES = 30;

const createRequestSchema = z
  .object({
    vehicleId: z.string().trim().min(1, 'vehicleId é obrigatório'),
    startDate: isoLocalDatetime,
    endDate: isoLocalDatetime,
    purpose: z.string().trim().min(3, 'purpose muito curto').max(300, 'purpose muito longo'),
  })
  .superRefine((data, ctx) => {
    const start = new Date(`${data.startDate}:00Z`);
    const end = new Date(`${data.endDate}:00Z`);

    if (isNaN(start.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: 'startDate inválida' });
      return;
    }

    if (isNaN(end.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'endDate inválida' });
      return;
    }

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'endDate deve ser posterior a startDate',
      });
    }

    // Enforce slot alignment
    const startMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
    const endMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();

    if (startMinutes % SLOT_MINUTES !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startDate'],
        message: `Horário de início deve ser múltiplo de ${SLOT_MINUTES} minutos`,
      });
    }

    if (endMinutes % SLOT_MINUTES !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: `Horário de término deve ser múltiplo de ${SLOT_MINUTES} minutos`,
      });
    }
  });

const adminDecisionSchema = z.object({
  adminNotes: z.string().trim().max(500).optional().default(''),
});

const cancelRequestSchema = z.object({
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
  SLOT_MINUTES,
};