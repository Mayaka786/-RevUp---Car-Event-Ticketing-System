const nodemailer = require("nodemailer");
const fs = require("fs");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendTicketEmail(toEmail, pdfBuffer, ticketId) {
  const mailOptions = {
    from: `"RevUp Tickets" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your RevUp Ticket [#${ticketId}]`,
    html: `<p>Hey there!</p>
           <p>Your RevUp event ticket is attached below as a PDF.</p>
           <p>Show it at the gate to check in 🚗</p>`,
    attachments: [
      {
        filename: `RevUp_Ticket_${ticketId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };
  await transporter.sendMail(mailOptions);
  console.log(`📨 Email sent to ${toEmail}`);
}

module.exports = { sendTicketEmail };
