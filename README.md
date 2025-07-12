# 🚗 RevUp - Car Event Ticketing System

**RevUp** is a modern full-stack ticketing system for car events built with **Node.js**, **Express**, **MySQL**, and a beautiful dark-themed frontend UI. It integrates secure payments using the **Pesapal API** and supports admin features like event management, QR code scanning, email ticket delivery, and CSV exports.

---

## 🔧 Features

### 🎫 Client Side
- Browse upcoming car events
- Purchase event tickets with live price calculation
- Seamless Pesapal iframe payment flow
- Automatic email delivery of ticket (PDF with QR code)
- Downloadable ticket upon successful payment

### 🛠️ Admin Panel
- Secure admin login/logout using JWT in HTTP-only cookies
- Create, update, delete car events via dashboard
- View statistics: total events, revenue, tickets sold
- Filter/search events
- Export events and tickets as CSV
- QR code check-in for ticket verification
- Fully responsive dark UI with neon-glow style

---

## 🧾 Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT + HTTP-only cookies
- **PDF & QR Code**: PDFKit + QRCode
- **Email**: Nodemailer
- **Payments**: Pesapal API
- **Exports**: json2csv

---

## 🚀 Installation

```bash
git clone https://github.com/Mayaka786/-RevUp---Car-Event-Ticketing-System.git
cd RevUp---Car-Event-Ticketing-System
npm install
