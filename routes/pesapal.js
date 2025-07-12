const express = require('express');
const router = express.Router();
const pesapal = require('../utils/pesapal');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const { sendTicketEmail } = require('../utils/mailer');

// ✅ Pesapal callback
router.get('/callback', async (req, res) => {
  try {
    const { OrderTrackingId } = req.query;
    if (!OrderTrackingId) return res.redirect('/?error=missing_tracking_id');

    const token = (await pesapal.getAccessToken()).token;
    const status = await pesapal.getTransactionStatus(OrderTrackingId, token);
    const paymentStatus = status.payment_status_description;

    const [records] = await req.app.locals.db.execute(
      'SELECT * FROM pesapal_interim_payment WHERE orderTrackingId = ?',
      [OrderTrackingId]
    );

    if (!records.length) return res.redirect('/?error=payment_record_not_found');

    const interimPayment = records[0];
    const ticketId = interimPayment.ticketId;

    if (paymentStatus === 'Completed') {
      // ✅ Update ticket
      await req.app.locals.db.execute(
        `UPDATE ticket SET 
          paymentStatus = 'Completed',
          receiptNumber = ?,
          paymentMethod = ?,
          transactionDate = NOW()
         WHERE ticketId = ?`,
        [status.confirmation_code, `Pesapal - ${status.payment_method}`, ticketId]
      );

      // ✅ Update interim
      await req.app.locals.db.execute(
        'UPDATE pesapal_interim_payment SET status = "COMPLETED" WHERE interimPaymentId = ?',
        [interimPayment.interimPaymentId]
      );

      // ✅ Fetch full ticket
      const [ticketRows] = await req.app.locals.db.execute(
        `SELECT t.*, e.title AS eventTitle, e.eventDate AS showTime 
         FROM ticket t 
         JOIN event e ON t.eventId = e.eventId 
         WHERE t.ticketId = ?`,
        [ticketId]
      );

      const ticket = ticketRows[0];

      if (ticket && ticket.email) {
        try {
          // Generate QR
          const qrData = `https://revup.com/verify?ticketId=${ticketId}`;
          const qrImage = await QRCode.toDataURL(qrData);

          // Generate PDF using PDFKit
          const doc = new PDFDocument();
          const buffers = [];

          doc.on('data', buffers.push.bind(buffers));
          doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(buffers);
            await sendTicketEmail(ticket.email, pdfBuffer, ticketId);
            console.log(`📧 Ticket emailed to ${ticket.email}`);
          });

          // ✅ RevUp Custom Ticket Design
          try {
            doc.image('public/assets/logo.png', {
              fit: [120, 120],
              align: 'center',
              valign: 'center'
            });
          } catch (e) {
            console.warn('⚠️ Logo image not found or failed to load');
          }

          doc.moveDown();
          doc.fontSize(22).fillColor('#00bfff').text('RevUp Car Event Ticket', {
            align: 'center'
          });
          doc.moveDown(1);

          doc.fontSize(14).fillColor('#ffffff');
          doc.text(`🎟️ Event: ${ticket.eventTitle}`);
          doc.text(`📅 Date: ${new Date(ticket.showTime).toLocaleString()}`);
          doc.text(`👤 Name: ${ticket.customerName}`);
          doc.text(`📞 Phone: ${ticket.phoneNumber}`);
          doc.text(`📧 Email: ${ticket.email || 'N/A'}`);
          doc.text(`🎫 Quantity: ${ticket.quantity}`);
          doc.text(`💰 Total Paid: KES ${ticket.totalAmount}`);
          doc.text(`🧾 Receipt: ${ticket.receiptNumber || 'N/A'}`);
          doc.text(`📌 Status: ${ticket.paymentStatus}`);
          doc.moveDown();

          const qr = qrImage.split(',')[1];
          doc.image(Buffer.from(qr, 'base64'), {
            fit: [150, 150],
            align: 'center',
            valign: 'center'
          });

          doc.end();
        } catch (err) {
          console.error('❌ Email generation failed:', err);
        }
      }

      return res.redirect(`/ticket.html?ticketId=${ticketId}&status=success`);
    } else if (paymentStatus === 'Failed') {
      await req.app.locals.db.execute(
        'UPDATE ticket SET paymentStatus = "Failed" WHERE ticketId = ?',
        [ticketId]
      );
      await req.app.locals.db.execute(
        'UPDATE pesapal_interim_payment SET status = "FAILED" WHERE interimPaymentId = ?',
        [interimPayment.interimPaymentId]
      );

      return res.redirect('/?error=payment_failed');
    }

    res.redirect('/?status=pending');
  } catch (err) {
    console.error('❌ Callback Error:', err);
    res.redirect('/?error=callback_error');
  }
});

// ✅ IPN notification
router.get('/ipn', async (req, res) => {
  try {
    const { OrderTrackingId } = req.query;
    if (!OrderTrackingId) return res.status(400).send('Missing OrderTrackingId');

    const token = (await pesapal.getAccessToken()).token;
    const status = await pesapal.getTransactionStatus(OrderTrackingId, token);
    const paymentStatus = status.payment_status_description;

    const [records] = await req.app.locals.db.execute(
      'SELECT * FROM pesapal_interim_payment WHERE orderTrackingId = ?',
      [OrderTrackingId]
    );

    if (!records.length) return res.status(404).send('Record not found');

    const ticketId = records[0].ticketId;

    if (paymentStatus === 'Completed') {
      await req.app.locals.db.execute(
        `UPDATE ticket SET 
          paymentStatus = 'Completed',
          receiptNumber = ?,
          paymentMethod = ?,
          transactionDate = NOW()
         WHERE ticketId = ?`,
        [status.confirmation_code, `Pesapal - ${status.payment_method}`, ticketId]
      );

      await req.app.locals.db.execute(
        'UPDATE pesapal_interim_payment SET status = "COMPLETED" WHERE interimPaymentId = ?',
        [records[0].interimPaymentId]
      );
    } else if (paymentStatus === 'Failed') {
      await req.app.locals.db.execute(
        'UPDATE ticket SET paymentStatus = "Failed" WHERE ticketId = ?',
        [ticketId]
      );
      await req.app.locals.db.execute(
        'UPDATE pesapal_interim_payment SET status = "FAILED" WHERE interimPaymentId = ?',
        [records[0].interimPaymentId]
      );
    }

    res.status(200).send('IPN received');
  } catch (err) {
    console.error('❌ IPN Error:', err);
    res.status(500).send('IPN processing error');
  }
});

module.exports = router;
