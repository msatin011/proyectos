require('dotenv').config();
const sql = require('mssql');

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

console.log('Testing connection with:', {
    user: dbConfig.user,
    server: dbConfig.server,
    database: dbConfig.database,
    options: dbConfig.options
});

sql.connect(dbConfig).then(() => {
    console.log('Connection SUCCESS!');
    process.exit(0);
}).catch(err => {
    console.error('Connection FAILED:', err);
    process.exit(1);
});
