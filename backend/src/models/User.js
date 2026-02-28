// backend/src/models/User.js
const mongoose = require('mongoose');

const USER_ROLE = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 5,
      maxlength: 160,
      // NOTE: validação “leve” aqui. Regras (ex: formato estrito) ficam em validator (Zod) na Fase 3.
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 200,
      // SEC: aqui ainda é string “crua” (Fase 1). Hash com bcrypt é responsabilidade do AuthService (Fase 2).
    },

    role: {
      type: String,
      required: true,
      enum: Object.values(USER_ROLE),
      default: USER_ROLE.USER,
    },

    department: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },

    registrationId: {
      type: String,
      trim: true,
      maxlength: 40,
      default: '',
      // NOTE: matrícula/identificador interno do usuário (se sua frota usar isso).
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  USER_ROLE,
};