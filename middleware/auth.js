const { verifyToken } = require('../utils/auth');

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ success: false, error: 'Missing token' });

  const token = authHeader.split(' ')[1];

  try {
    const admin = verifyToken(token);
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

module.exports = adminAuth;
