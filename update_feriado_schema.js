const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
    }
};

async function updateSchema() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('Connected to DB.');

        // Add usuarioID column if not exists
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'feriado' AND COLUMN_NAME = 'usuarioID')
            BEGIN
                ALTER TABLE feriado ADD usuarioID INT;
            END
        `);
        console.log('Column usuarioID ensured in feriado table.');

        // Since it's a new feature and we want it to be part of the primary check, 
        // we might want to update existing records (if any) or just leave them with NULL.
        // The user said "agrege usuarioID para tener feriados independientes".

        await sql.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

updateSchema();
