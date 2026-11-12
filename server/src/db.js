const mysql = require('mysql2/promise');

// Hosted MySQL (Railway, etc.) usually provides one URL; locally we use separate vars.
const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

const pool = url
  ? mysql.createPool({ uri: url, waitForConnections: true, connectionLimit: 10 })
  : mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    });

module.exports = pool;
