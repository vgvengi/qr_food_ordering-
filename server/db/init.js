// Creates tables and seed data on whatever database the env points to.
// Usage: npm run db:init   (works on Railway, no mysql CLI needed)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const conn = url
    ? await mysql.createConnection({ uri: url, multipleStatements: true })
    : await mysql.createConnection({
        host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER, password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME, multipleStatements: true,
      });
  // Hosted DBs come with their own database already selected, so drop the CREATE DATABASE / USE lines.
  const strip = (sql) => sql.replace(/^\s*(CREATE DATABASE|USE)\b.*$/gim, '');
  for (const f of ['schema.sql', 'seed.sql']) {
    await conn.query(strip(fs.readFileSync(path.join(__dirname, f), 'utf8')));
    console.log(`applied ${f}`);
  }
  await conn.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
