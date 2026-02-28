require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const { User, USER_ROLE } = require('../src/models/User');

const run = async () => {
  try {
    await connectDatabase();

    const payload = {
      name: 'Eduardo Henrique',
      email: 'eduardo.dev@example.com',
      password: '123456', // SEC: apenas para Fase 1 (hash virá na Fase 2)
      role: USER_ROLE.ADMIN,
      department: 'TI',
      registrationId: 'DEV001',
    };

    const user = await User.findOneAndUpdate(
      { email: payload.email },
      { $set: payload },
      { new: true, upsert: true, runValidators: true }
    );

    console.log('✅ User upserted:', {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed user failed:', error);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
};

run();