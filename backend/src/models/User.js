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
      // NOTE: lightweight validation only. Strict format rules are enforced by the Zod validator.
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 200,
      // SEC: hashing is the responsibility of AuthService — the model stores the hash only.
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
      // NOTE: internal employee ID — optional depending on fleet configuration.
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// NOTE: unique: true on the email field already creates the index — adding schema.index would cause a duplicate index warning.

module.exports = {
  User: mongoose.model('User', userSchema),
  USER_ROLE,
};