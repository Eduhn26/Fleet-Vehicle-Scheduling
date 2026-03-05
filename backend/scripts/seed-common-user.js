require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDatabase = require('../src/config/database');
const { User, USER_ROLE } = require('../src/models/User');

const BCRYPT_SALT_ROUNDS = 10;

const run = async () => {
  try {
    await connectDatabase();

    const passwordHash = await bcrypt.hash('123456', BCRYPT_SALT_ROUNDS);

    const payload = {
      name: 'Usuario Comum',
      email: 'user@test.com',
      password: passwordHash,
      role: USER_ROLE.USER,
      department: 'Operações',
      registrationId: 'USER001',
    };

    const user = await User.findOneAndUpdate(
      { email: payload.email },
      { $set: payload },
      {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
      }
    );

    console.log('✅ Common user upserted:', {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed common user failed:', error);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
};

run();