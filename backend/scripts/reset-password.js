require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { User } = require('../src/models/User');

function resolveMongoUri() {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    ''
  );
}

/*
SEC:
This script is intended only for local recovery and manual development use.
It should never be executed against production data because it contains
hardcoded credentials and bypasses the normal password reset flow.
*/
async function resetPassword() {
  const mongoUri = resolveMongoUri();

  if (!mongoUri) {
    console.error(
      'Erro: URI do MongoDB não encontrada.\n' +
        'Defina uma destas variáveis no backend/.env:\n' +
        '- MONGO_URI\n' +
        '- MONGODB_URI\n' +
        '- MONGO_URL\n' +
        '- DATABASE_URL\n'
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);

    const email = 'eduardo.dev@example.com';
    const newPassword = '123456';

    const user = await User.findOne({ email });

    if (!user) {
      console.log('Usuário não encontrado:', email);
      await mongoose.connection.close();
      process.exit(0);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log('Senha resetada com sucesso!');
    console.log('Email:', email);
    console.log('Nova senha:', newPassword);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Erro ao resetar senha:', err);
    process.exit(1);
  }
}

resetPassword();