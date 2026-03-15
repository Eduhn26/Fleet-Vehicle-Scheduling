require('dotenv').config();
const app = require('./src/app');
const connectDatabase = require('./src/config/database');

const PORT = process.env.PORT || 5000;

/*
ENGINEERING NOTE:
startServer is async so the database connection is fully established
before the HTTP server begins accepting requests.
This prevents the API from serving traffic before persistence is ready.
*/
const startServer = async () => {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown (desligamento limpo)
  process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    server.close(() => process.exit(0));
  });
};

startServer();