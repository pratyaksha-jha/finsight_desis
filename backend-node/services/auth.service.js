const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User.model');


const AuthService = {
  async register({ name, email, password, role, budget }) {
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new Error('Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserModel.create({
      name, email, passwordHash, role,
      budget: role === 'student' ? (budget || null) : null
    });

    const token = this.signToken(user);
    return { user: this.sanitize(user), token };
  },

  async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new Error('Invalid credentials');

    const token = this.signToken(user);
    return { user: this.sanitize(user), token };
  },

  signToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  },

  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  },

  sanitize(user) {
    // Never return password hash to client
    const { password_hash, ...safe } = user;
    return safe;
  }
};

module.exports = AuthService;