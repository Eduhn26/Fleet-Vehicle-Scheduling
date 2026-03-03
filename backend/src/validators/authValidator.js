const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().min(5).max(200).email(),
  password: z.string().min(3).max(200),
});

module.exports = {
  loginSchema,
};