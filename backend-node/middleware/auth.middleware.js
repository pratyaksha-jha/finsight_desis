const AuthService = require('../services/auth.service');
const UserModel = require('../models/User.model');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });

    const token = header.split(' ')[1];
    const decoded = AuthService.verifyToken(token);

    // Attach full user to req
    req.user = await UserModel.findById(decoded.id);
    if (!req.user) return res.status(401).json({ error: 'User not found' });

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };