# 🚗 RevUp - Car Event Ticketing System

**RevUp** is a modern full-stack ticketing system for car events built with **Node.js**, **Express**, **MySQL**, and a beautiful dark-themed frontend UI. It integrates secure payments using the **Pesapal API** and supports admin features like event management, QR code scanning, email ticket delivery, and CSV exports.

---

## 🔧 Features

### 🛠️ Admin Panel
- Secure admin login/logout using JWT in HTTP-only cookies
- Create, update, delete car events via dashboard
- View statistics: total events, revenue, tickets sold
- Filter/search events
- Export events and tickets as CSV
- Fully responsive dark UI with royal blue style

### 🎫 Client Side
- Browse upcoming car events
- Purchase event tickets with live price calculation
- Seamless Pesapal iframe payment flow

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
DB_HOST=localhost //Change to your database host
DB_USER=root //Change to your database user
DB_PASSWORD=yourpassword //Input your database password
DB_NAME=revup
JWT_SECRET=revupsecret
PESAPAL_CONSUMER_KEY=your_key //Input your pesapal Key
PESAPAL_CONSUMER_SECRET=your_secret //Input your pesapal secret
PESAPAL_CALLBACK_URL=http://localhost:3000/api/pesapal/callback


🗃️ MySQL Tables
Create a database called revup
use revup
In revup add the following tables.
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
a. Admin Panel → http://localhost:3000/admin-login.html
-Create an event
b. Frontend User Panel → http://localhost:3000
-Choose one of the created events and proceed to paying for the ticket.

📦 Project Structure
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

