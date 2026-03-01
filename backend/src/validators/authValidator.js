const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('email inválido').min(5).max(160);
const password = z.string().min(6, 'password deve ter no mínimo 6 caracteres').max(200);

const registerSchema = z.object({
  name: z.string().trim().min(2, 'name muito curto').max(120, 'name muito longo'),
  email,
  password,
  department: z.string().trim().max(80).optional().default(''),
  registrationId: z.string().trim().max(40).optional().default(''),
  // NOTE: role não vem do client no MVP. Evita user se promovendo pra admin.
});

const loginSchema = z.object({
  email,
  password,
});

module.exports = {
  registerSchema,
  loginSchema,
};