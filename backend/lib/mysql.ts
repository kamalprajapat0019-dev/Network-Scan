import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query(sql: string, params?: any[]) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function initializeDatabase() {
  const tableName = process.env.MYSQL_TABLE || 'Audit_Scanner';
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      scanId VARCHAR(50) UNIQUE,
      auditor_name VARCHAR(100),
      center_code INT,
      center_name VARCHAR(150),
      city VARCHAR(50),
      contact VARCHAR(20),
      total_systems INT,
      pcs INT,
      printers INT,
      lan_subnet VARCHAR(50),
      local_ip VARCHAR(50),
      ipList LONGTEXT,
      devices LONGTEXT,
      scanDetails LONGTEXT,
      scannedBy VARCHAR(50),
      scanned_at DATETIME,
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS \`users\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'auditor',
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  try {
    await query(createTableQuery);
    console.log(`✅ Table \`${tableName}\` is ready.`);
    
    await query(createUsersTableQuery);
    console.log(`✅ Table \`users\` is ready.`);
  } catch (error) {
    console.error(`❌ Error initializing MySQL tables:`, error);
    throw error;
  }
}

export default pool;
