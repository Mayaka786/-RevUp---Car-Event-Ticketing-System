require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const cookieParser = require('cookie-parser');
const exportRoutes = require('./routes/admin-export');
const eventsRoutes = require('./routes/events.js');
const ticketsRoutes = require('./routes/tickets.js');
const pesapalRoutes = require('./routes/pesapal.js');
const adminRoutes = require('./routes/admin.js');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/admin/export', exportRoutes);

// ✅ Database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
app.locals.db = pool;

// ✅ Routes
app.use('/api/events', eventsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/pesapal', pesapalRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 RevUp Car Event Server running at http://localhost:${PORT}`);
});
