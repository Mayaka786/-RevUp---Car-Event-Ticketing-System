CREATE DATABASE IF NOT EXISTS revup_events;
USE revup_events;

CREATE TABLE IF NOT EXISTS events (
    eventId INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    eventDate DATETIME NOT NULL,
    location VARCHAR(100),
    address VARCHAR(255),
    parkingInfo VARCHAR(255),
    organizerName VARCHAR(100),
    organizerContact VARCHAR(100),
    imageUrl VARCHAR(255),
    ticketTiers JSON NOT NULL,
    ticketsAvailable INT NOT NULL,
    rating DECIMAL(2,1)
);

CREATE TABLE IF NOT EXISTS tickets (
    ticketId INT AUTO_INCREMENT PRIMARY KEY,
    eventId INT,
    customerName VARCHAR(255),
    phoneNumber VARCHAR(20),
    ticketTier VARCHAR(100),
    quantity INT,
    totalAmount DECIMAL(10,2),
    paymentStatus VARCHAR(50),
    receiptNumber VARCHAR(100),
    paymentMethod VARCHAR(50),
    orderTrackingId VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eventId) REFERENCES events(eventId)
);
