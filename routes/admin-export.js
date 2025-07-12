// routes/admin-export.js
const express = require("express");
const router = express.Router();
const { Parser } = require("json2csv");

// Export Events CSV
router.get("/events/csv", async (req, res) => {
  try {
    const [rows] = await req.app.locals.db.execute(`
      SELECT title, category, location, eventDate, price, description FROM event
    `);

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment("events.csv");
    res.send(csv);
  } catch (err) {
    console.error("❌ Event export error:", err);
    res.status(500).json({ error: "Failed to export events" });
  }
});

// Export Tickets CSV
router.get('/tickets/csv', async (req, res) => {
  try {
    const [rows] = await req.app.locals.db.execute(`
      SELECT 
        t.ticketId, t.customerName, t.email, t.phoneNumber, 
        e.title AS eventTitle, t.quantity, t.totalAmount, 
        t.paymentStatus, t.createdAt
      FROM ticket t
      JOIN event e ON t.eventId = e.eventId
      WHERE t.paymentStatus = 'Completed'
    `);

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('tickets.csv');
    res.send(csv);
  } catch (err) {
    console.error('❌ Ticket export error:', err);
    res.status(500).json({ error: 'Failed to export tickets' });
  }
});

module.exports = router;
