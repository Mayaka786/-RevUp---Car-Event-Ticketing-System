const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const SECRET = process.env.JWT_SECRET || 'revup_secret';

function generateToken(admin) {
  return jwt.sign(
    { adminId: admin.adminId, email: admin.email },
    SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword
};
