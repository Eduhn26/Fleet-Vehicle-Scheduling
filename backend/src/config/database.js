const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`📦 MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Erro ao conectar no MongoDB:', error.message);
    process.exit(1); // NOTE: fail fast — servidor sem banco é bug silencioso
  }
};

module.exports = connectDatabase;