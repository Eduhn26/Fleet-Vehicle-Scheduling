const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { User } = require('../models/User');
const AppError = require('../utils/AppError');

const fail = (message, statusCode) => {
  throw new AppError(message, statusCode);
};

const assertJwtSecret = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret) {
    throw new Error('JWT_SECRET não configurado. API não deve rodar sem secret.');
  }
  return secret;
};

const formatUser = (userDoc) => ({
  id: userDoc._id.toString(),
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
});

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