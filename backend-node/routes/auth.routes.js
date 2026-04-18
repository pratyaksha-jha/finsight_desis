const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireStudent, requireAdult } = require('../middleware/role.middleware');

// Public
router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);

// Protected — any logged in user
router.get('/me', authenticate, ctrl.me);

// Guardian invite flow
router.get('/invite/:token', authenticate, requireAdult, ctrl.acceptInvite);

module.exports = router;