const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // or your username
  password: '', // your MySQL password
  database: 'auth_demo',
});

module.exports = pool;