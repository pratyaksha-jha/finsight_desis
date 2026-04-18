// Usage: router.post('/approve', authenticate, requireRole('adult'), handler)

const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: `Access restricted to: ${roles.join(', ')}` });
    next();
  };
  
  // Specific helpers for clean route code
  const requireStudent = requireRole('student');
  const requireAdult   = requireRole('adult');
  
  module.exports = { requireRole, requireStudent, requireAdult };