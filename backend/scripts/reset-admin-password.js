const bcrypt = require('bcryptjs');

require('dotenv').config();

const connectDB = require('../src/config/database');
const { User } = require('../src/models/User');

const run = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    throw new Error('SEC: reset de senha bloqueado em production');
  }

  const email = String(process.argv[2] || '').trim().toLowerCase();
  const newPassword = String(process.argv[3] || '');

  if (!email) throw new Error('Uso: node scripts/reset-admin-password.js <email> <novaSenha>');
  if (!newPassword || newPassword.length < 6) {
    throw new Error('novaSenha inválida (mín. 6 caracteres)');
  }

  await connectDB();

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new Error(`Usuário não encontrado para email: ${email}`);
  }

  if (String(user.role) !== 'admin') {
    throw new Error(`Usuário encontrado não é admin (role=${user.role})`);
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  const result = await User.updateOne(
    { _id: user._id },
    { $set: { password: hashed } }
  );

  if (result.modifiedCount !== 1) {
    throw new Error('Falha ao atualizar senha (nenhum documento modificado)');
  }

  console.log(`OK: senha atualizada para admin ${email} (NODE_ENV=${process.env.NODE_ENV || 'undefined'})`);
};

run().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});