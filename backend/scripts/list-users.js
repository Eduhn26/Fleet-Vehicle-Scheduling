require('dotenv').config();
const mongoose = require('mongoose');

const { User } = require('../src/models/User');

/*
ENGINEERING NOTE:
Operational helper script used to list registered users directly from
the database. This is useful for debugging authentication issues or
verifying seed execution in local environments.
*/

function resolveMongoUri() {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    ''
  );
}

async function listUsers() {
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

    const users = await User.find().select('-password').lean();

    if (users.length === 0) {
      console.log('Nenhum usuário encontrado.');
    } else {
      console.log('\n=== USUÁRIOS CADASTRADOS ===\n');

      users.forEach((user, index) => {
        console.log(`Usuário ${index + 1}`);
        console.log(`ID: ${user._id}`);
        console.log(`Nome: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log('---------------------------');
      });
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    process.exit(1);
  }
}

listUsers();