const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { User } = require('../models/User');
const AppError = require('../utils/AppError');

const fail = (message, statusCode) => {
  throw new AppError(message, statusCode);
};

/*
ENGINEERING NOTE:
JWT_SECRET is validated eagerly at call time rather than at startup.
This ensures any misconfigured environment fails loudly on the first
authenticated operation instead of silently accepting all tokens.
*/
const assertJwtSecret = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret) {
    throw new Error('JWT_SECRET não configurado. API não deve rodar sem secret.');
  }
  return secret;
};

// NOTE: only public-safe fields are exposed — password hash is never returned.
const formatUser = (userDoc) => ({
  id: userDoc._id.toString(),
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
});

/*
ENGINEERING NOTE:
Both "user not found" and "wrong password" return the same 401 message.
Distinguishing them would allow user enumeration attacks.
*/
const login = async ({ email, password }) => {
  const e = String(email || '').trim().toLowerCase();
  const p = String(password || '');

  if (!e) fail('email é obrigatório', 400);
  if (!p) fail('password é obrigatório', 400);

  const user = await User.findOne({ email: e });
  if (!user) fail('Credenciais inválidas', 401);

  const ok = await bcrypt.compare(p, user.password);
  if (!ok) fail('Credenciais inválidas', 401);

  const secret = assertJwtSecret();

  // NOTE: token carries userId and role so downstream middleware
  // can authorize without an extra database round-trip.
  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    secret,
    { expiresIn: '24h' }
  );

  return { token, user: formatUser(user) };
};

module.exports = {
  login,
};