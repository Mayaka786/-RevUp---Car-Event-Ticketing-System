const express = require('express');
const router = express.Router();
const pesapal = require('../utils/pesapal');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { sendTicketEmail } = require('../utils/mailer');

// ✅ Payment route (email included)
router.post('/make-payment', async (req, res) => {
  const { eventId, customerName, phoneNumber, quantity, email } = req.body;

  if (!eventId || !customerName || !phoneNumber || !quantity) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const [events] = await req.app.locals.db.execute('SELECT * FROM event WHERE eventId = ?', [eventId]);
    if (!events.length) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const event = events[0];
    const totalAmount = parseFloat(event.price) * parseInt(quantity);

    const [ticketResult] = await req.app.locals.db.execute(
      `INSERT INTO ticket (eventId, customerName, phoneNumber, email, quantity, totalAmount, paymentStatus)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [eventId, customerName, phoneNumber, email || null, quantity, totalAmount]
    );

    const ticketId = ticketResult.insertId;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const { token } = await pesapal.getAccessToken();
    const { ipn_id } = await pesapal.getNotificationId(token, `${baseUrl}/api/pesapal/ipn`);
    const merchantReference = `TICKET_${ticketId}_${Date.now()}`;

    const orderDetails = {
      amount: totalAmount,
      customerName,
      phoneNumber,
      eventTitle: event.title,
      description: `Car event ticket for ${event.title}`,
      merchantReference,
      notification_id: ipn_id
    };

    const { order_tracking_id, redirect_url } = await pesapal.getMerchantOrderUrl(orderDetails, token, baseUrl);

    await req.app.locals.db.execute(
      `INSERT INTO pesapal_interim_payment (ticketId, orderTrackingId, merchantReference, iframeSrc, status)
       VALUES (?, ?, ?, ?, 'SAVED')`,
      [ticketId, order_tracking_id, merchantReference, redirect_url]
    );

    res.json({
      success: true,
      ticketId,
      orderTrackingId: order_tracking_id,
      redirectUrl: redirect_url,
      message: 'Payment initiated successfully'
    });
  } catch (err) {
    console.error('❌ Error initiating payment:', err);
    res.status(500).json({ success: false, error: 'Failed to initiate payment' });
  }
});

// ✅ Get a single ticket (with QR)
router.get('/:id', async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const [tickets] = await req.app.locals.db.execute(
      `SELECT t.*, e.title AS eventTitle, e.eventDate AS showTime 
       FROM ticket t JOIN event e ON t.eventId = e.eventId 
       WHERE t.ticketId = ?`,
      [ticketId]
    );

    if (!tickets.length) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const ticket = tickets[0];
    ticket.qrCode = await QRCode.toDataURL(`revup://ticket/${ticketId}`);

    res.json({ success: true, ticket });
  } catch (error) {
    console.error('❌ Error fetching ticket:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ticket' });
  }
});

// ✅ Check-in route
router.post('/checkin/:id', async (req, res) => {
  const ticketId = parseInt(req.params.id);

  const [tickets] = await req.app.locals.db.execute(
    'SELECT * FROM ticket WHERE ticketId = ?', [ticketId]
  );

  if (!tickets.length) {
    return res.status(404).json({ success: false, message: 'Ticket not found' });
  }

  const ticket = tickets[0];

  if (ticket.paymentStatus !== 'Completed') {
    return res.status(400).json({ success: false, message: 'Ticket not paid' });
  }

  if (ticket.isCheckedIn) {
    return res.status(400).json({ success: false, message: 'Ticket already used' });
  }

  await req.app.locals.db.execute(
    'UPDATE ticket SET isCheckedIn = TRUE WHERE ticketId = ?', [ticketId]
  );

  res.json({ success: true, message: 'Ticket checked in successfully' });
});

// ✅ Manual download PDF
router.get('/download/:id', async (req, res) => {
  const ticketId = parseInt(req.params.id);

  const [tickets] = await req.app.locals.db.execute(
    `SELECT t.*, e.title AS eventTitle, e.eventDate AS showTime 
     FROM ticket t JOIN event e ON t.eventId = e.eventId 
     WHERE t.ticketId = ?`,
    [ticketId]
  );

  if (!tickets.length) {
    return res.status(404).json({ success: false, error: 'Ticket not found' });
  }

  const ticket = tickets[0];
  const qrData = `revup://ticket/${ticketId}`;
  const qrImage = await QRCode.toDataURL(qrData);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ticket_${ticketId}.pdf"`);

  doc.fontSize(20).text('🎫 RevUp Car Event Ticket', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Event: ${ticket.eventTitle}`);
  doc.text(`Date: ${new Date(ticket.showTime).toLocaleString()}`);
  doc.text(`Name: ${ticket.customerName}`);
  doc.text(`Phone: ${ticket.phoneNumber}`);
  if (ticket.email) doc.text(`Email: ${ticket.email}`);
  doc.text(`Quantity: ${ticket.quantity}`);
  doc.text(`Total: KES ${ticket.totalAmount}`);
  doc.text(`Status: ${ticket.paymentStatus}`);
  doc.moveDown();

  const qr = qrImage.split(',')[1];
  doc.image(Buffer.from(qr, 'base64'), { fit: [150, 150], align: 'center' });

  doc.end();
  doc.pipe(res);
});

// ✅ Resend Ticket by Email
router.post('/resend', async (req, res) => {
  const { email, ticketId } = req.body;

  if (!email || !ticketId) {
    return res.status(400).json({ success: false, error: 'Email and ticketId required' });
  }

  try {
    const [tickets] = await req.app.locals.db.execute(
      `SELECT t.*, e.title AS eventTitle, e.eventDate AS showTime 
       FROM ticket t 
       JOIN event e ON t.eventId = e.eventId 
       WHERE t.ticketId = ? AND t.email = ? AND t.paymentStatus = 'Completed'`,
      [ticketId, email]
    );

    if (!tickets.length) {
      return res.status(404).json({ success: false, error: 'Ticket not found or unpaid' });
    }

    const ticket = tickets[0];
    const qrData = `https://revup.com/verify?ticketId=${ticketId}`;
    const qrImage = await QRCode.toDataURL(qrData);

    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      await sendTicketEmail(ticket.email, pdfBuffer, ticketId);
      console.log(`📨 Resent ticket to ${ticket.email}`);
    });

    doc.fontSize(20).text('🎫 RevUp Car Event Ticket', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Event: ${ticket.eventTitle}`);
    doc.text(`Date: ${new Date(ticket.showTime).toLocaleString()}`);
    doc.text(`Name: ${ticket.customerName}`);
    doc.text(`Phone: ${ticket.phoneNumber}`);
    doc.text(`Email: ${ticket.email}`);
    doc.text(`Qty: ${ticket.quantity}`);
    doc.text(`Total Paid: KES ${ticket.totalAmount}`);
    doc.text(`Receipt: ${ticket.receiptNumber || 'N/A'}`);
    doc.text(`Status: ${ticket.paymentStatus}`);
    doc.moveDown();

    const qr = qrImage.split(',')[1];
    doc.image(Buffer.from(qr, 'base64'), { fit: [150, 150], align: 'center' });
    doc.end();

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Resend error:', err);
    res.status(500).json({ success: false, error: 'Could not resend ticket' });
  }
});

// ✅ GET ALL TICKETS (Admin View)
router.get('/', async (req, res) => {
  try {
    const [tickets] = await req.app.locals.db.execute(`
      SELECT t.*, e.title AS eventTitle, e.eventDate AS showTime
      FROM ticket t
      JOIN event e ON t.eventId = e.eventId
      ORDER BY t.ticketId DESC
    `);
    res.json({ success: true, tickets });
  } catch (err) {
    console.error('❌ Error loading all tickets:', err);
    res.status(500).json({ success: false, error: 'Failed to load tickets' });
  }
});

// ✅ DELETE TICKET
router.delete('/:id', async (req, res) => {
  const ticketId = parseInt(req.params.id);

  try {
    const [found] = await req.app.locals.db.execute(
      'SELECT * FROM ticket WHERE ticketId = ?', [ticketId]
    );

    if (!found.length) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    await req.app.locals.db.execute(
      'DELETE FROM ticket WHERE ticketId = ?', [ticketId]
    );

    res.json({ success: true, message: 'Ticket deleted' });
  } catch (err) {
    console.error('❌ Delete ticket error:', err);
    res.status(500).json({ success: false, error: 'Could not delete ticket' });
  }
  // GET /api/tickets/stats
router.get('/stats', async (req, res) => {
  try {
    const [[total]] = await req.app.locals.db.execute('SELECT COUNT(*) AS total FROM ticket');
    const [[completed]] = await req.app.locals.db.execute('SELECT COUNT(*) AS completed FROM ticket WHERE paymentStatus = "Completed"');
    const [[failed]] = await req.app.locals.db.execute('SELECT COUNT(*) AS failed FROM ticket WHERE paymentStatus = "Failed"');
    const [[checkedIn]] = await req.app.locals.db.execute('SELECT COUNT(*) AS checkedIn FROM ticket WHERE isCheckedIn = 1');

    res.json({
      success: true,
      stats: { total: total.total, completed: completed.completed, failed: failed.failed, checkedIn: checkedIn.checkedIn }
    });
  } catch (err) {
    console.error('❌ Stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});
});

module.exports = router;
