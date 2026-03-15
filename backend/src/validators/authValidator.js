const { z } = require('zod');

/*
ENGINEERING NOTE:
The password minimum is intentionally lenient at the transport layer.
Login validation only checks request shape; credential strength is enforced
when passwords are created or reset, not when users attempt to sign in.
*/
const loginSchema = z.object({
  email: z.string().min(5).max(200).email(),
  password: z.string().min(3).max(200),
});

module.exports = {
  loginSchema,
};