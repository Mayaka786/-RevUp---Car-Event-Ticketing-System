# 🚗 RevUp - Car Event Ticketing System

RevUp is a modern full-stack ticketing system for car events built with Node.js, Express, MySQL, and a beautiful dark-themed frontend UI. It integrates secure payments using the Pesapal API and supports admin features like event management, QR code scanning, email ticket delivery, and CSV exports.

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

## ⚙️ Environment Configuration

Create a `.env` file at the root with the following keys:

```env
PORT=3000                            # App running port
DB_HOST=localhost                    # MySQL host
DB_USER=root                         # MySQL user
DB_PASSWORD=yourpassword             # MySQL password
DB_NAME=revup                        # MySQL database name

JWT_SECRET=revupsecret               # JWT token secret key

PESAPAL_CONSUMER_KEY=your_key        # Pesapal consumer key
PESAPAL_CONSUMER_SECRET=your_secret  # Pesapal consumer secret
PESAPAL_CALLBACK_URL=http://localhost:3000/api/pesapal/callback

🗃️ MySQL Tables (Schema Setup)
💡 Copy-paste these into your MySQL terminal or phpMyAdmin

🧑‍💼 Admin Table

CREATE TABLE admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  passwordHash TEXT
);
🚘 Event Table

CREATE TABLE event (
  eventId INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100),
  category VARCHAR(50),
  description TEXT,
  eventDate DATETIME,
  location VARCHAR(100),
  price DECIMAL(10,2)
);
🎟️ Ticket Table

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
💳 Pesapal Interim Table

CREATE TABLE pesapal_interim_payment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticketId INT,
  orderTrackingId VARCHAR(255),
  merchantReference VARCHAR(255),
  iframeSrc TEXT,
  status VARCHAR(50)
);
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
.env.example
server.js
🚀 Running the App

npm run dev
Open your browser:

Frontend → http://localhost:3000

Admin Panel → http://localhost:3000/admin-login.html

📬 Contact
Developer: Engineer Ian Mayaka

Email: angwenyimayaka@gmail.com

📄 License
This project is for educational and demonstration purposes. Commercial usage requires explicit permission.