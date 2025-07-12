const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Gabriel@2613',
            database: 'revup_events'
        });
        console.log('Connected to database');
        const [rows] = await connection.query('SELECT 1');
        console.log('Test query result:', rows);
        await connection.end();
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

testConnection();