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

⚙️ Environment Configuration
Create a .env file in the root and configure:
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=revup
JWT_SECRET=revupsecret
PESAPAL_CONSUMER_KEY=your_key
PESAPAL_CONSUMER_SECRET=your_secret
PESAPAL_CALLBACK_URL=http://localhost:3000/api/pesapal/callback


🗃️ MySQL Tables
In your Database add the following tables.
-- Admin table
CREATE TABLE admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  passwordHash TEXT
);

-- Event table
CREATE TABLE event (
  eventId INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100),
  category VARCHAR(50),
  description TEXT,
  eventDate DATETIME,
  location VARCHAR(100),
  price DECIMAL(10,2)
);

-- Ticket table
CREATE TABLE ticket (
  ticketId INT AUTO_INCREMENT PRIMARY KEY,
  eventId INT,
  customerName VARCHAR(100),
  phoneNumber VARCHAR(20),
  email VARCHAR(100),
  quantity INT,
  totalAmount DECIMAL(10,2),
  paymentStatus VARCHAR(20),
  isCheckedIn BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pesapal Interim table
CREATE TABLE pesapal_interim_payment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticketId INT,
  orderTrackingId VARCHAR(255),
  merchantReference VARCHAR(255),
  iframeSrc TEXT,
  status VARCHAR(50)
);


 Running the App
npm run dev

Visit:
Admin Panel → http://localhost:3000/admin-login.html
Frontend User Panel → http://localhost:3000

📦 Project Structure
pgsql
Copy
Edit
📁 public/
├── index.html
├── admin-login.html
├── admin-dashboard.html
├── main.js
├── admin-dashboard.js
├── styles.css
├── admin-dashboard.css
├── hero.mp4
├── car images, logos, assets

📁 routes/
├── events.js
├── admin.js
├── tickets.js
├── pesapal.js
├── admin-export.js

📁 utils/
├── pesapal.js
├── mailer.js

.env
server.js

📬 Contact
For more information or collaboration:

Developer: Engineer Ian Mayaka

Email: angwenyimayaka@gmail.com

📄 License
This project is for educational and demonstration purposes. Commercial usage requires explicit permission.

