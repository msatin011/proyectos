const sql = require('mssql');
require('dotenv').config({ path: 'c:/PROYECTOS_APP/sass-tareas/.env' });

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

async function updateTable() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to SQL Server');

        const query = `
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID('mensaje') AND name = 'leido'
            )
            BEGIN
                ALTER TABLE mensaje ADD leido INT DEFAULT 0 NOT NULL;
                PRINT 'Column leido added successfully to mensaje table.';
            END
            ELSE
            BEGIN
                PRINT 'Column leido already exists in mensaje table.';
            END

            -- Also ensure id exists if it doesn't (though it probably does)
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID('mensaje') AND name = 'mensajeID'
            )
            BEGIN
                -- If there's no primary key, we might need one for easy marking as read
                -- Checking if there is any PK
                IF NOT EXISTS (SELECT * FROM information_schema.table_constraints WHERE table_name = 'mensaje' AND constraint_type = 'PRIMARY KEY')
                BEGIN
                     ALTER TABLE mensaje ADD mensajeID INT IDENTITY(1,1) PRIMARY KEY;
                     PRINT 'mensajeID column added as PRIMARY KEY.';
                END
            END
        `;

        await sql.query(query);
    } catch (err) {
        console.error('Error updating table:', err);
    } finally {
        await sql.close();
    }
}

updateTable();
