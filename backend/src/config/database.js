const mongoose = require('mongoose');

/*
ENGINEERING NOTE:
connectDatabase exits the process immediately if MONGODB_URI is missing
or if the connection attempt fails. This is intentional — running the API
without a database would result in silent failures on every data operation.
A hard exit makes misconfiguration visible immediately at startup.
*/
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