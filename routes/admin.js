const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'revupsecret';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // Change to true when using HTTPS
  sameSite: 'Lax',
  maxAge: 24 * 60 * 60 * 1000 // 1 day
};

// ✅ Admin Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: 'All fields required' });

    const [existing] = await req.app.locals.db.execute(
      'SELECT * FROM admin WHERE email = ?', [email]
    );
    if (existing.length > 0)
      return res.status(409).json({ success: false, error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    await req.app.locals.db.execute(
      'INSERT INTO admin (name, email, passwordHash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    res.json({ success: true, message: 'Admin registered successfully' });
  } catch (err) {
    console.error('❌ Admin registration error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ✅ Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [admins] = await req.app.locals.db.execute(
      'SELECT * FROM admin WHERE email = ?', [email]
    );

    if (admins.length === 0)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const admin = admins[0];
    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ adminId: admin.id }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('revup_token', token, COOKIE_OPTIONS);
    res.json({ success: true, message: 'Login successful' });
  } catch (err) {
    console.error('❌ Admin login error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ✅ Admin Profile (auth check)
router.get('/profile', async (req, res) => {
  const token = req.cookies.revup_token;
  if (!token) return res.status(401).json({ success: false, error: 'Not logged in' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await req.app.locals.db.execute(
      'SELECT id, name, email FROM admin WHERE id = ?', [decoded.adminId]
    );
    if (!rows.length) return res.status(401).json({ success: false, error: 'Admin not found' });

    res.json({ success: true, admin: rows[0] });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// ✅ Logout
router.post('/logout', (req, res) => {
  res.clearCookie('revup_token', COOKIE_OPTIONS);
  res.json({ success: true, message: 'Logged out' });
});

// ✅ Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    const db = req.app.locals.db;

    const [[{ totalEvents }]] = await db.execute(`SELECT COUNT(*) AS totalEvents FROM event`);
    const [[{ ticketsSold }]] = await db.execute(`SELECT SUM(quantity) AS ticketsSold FROM ticket WHERE paymentStatus = 'Completed'`);
    const [[{ revenue }]] = await db.execute(`SELECT SUM(totalAmount) AS revenue FROM ticket WHERE paymentStatus = 'Completed'`);

    res.json({
      success: true,
      stats: {
        totalEvents,
        ticketsSold: ticketsSold || 0,
        revenue: revenue || 0
      }
    });
  } catch (err) {
    console.error('❌ Stats Error:', err);
    res.status(500).json({ success: false, error: 'Failed to load dashboard stats' });
  }
});

module.exports = router;
