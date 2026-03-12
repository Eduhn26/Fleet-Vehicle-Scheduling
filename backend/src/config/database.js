const mongoose = require('mongoose');

const connectDatabase = async () => {
  const mongoUri = String(process.env.MONGODB_URI || '').trim();

  if (!mongoUri) {
    console.error('❌ MONGODB_URI não configurado.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);

    console.log(`📦 MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Erro ao conectar no MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;