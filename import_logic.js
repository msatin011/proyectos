
// Importar usuarios desde Excel
app.post('/api/usuarios/importar', authenticateToken, upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo.' });
        }

        const usuarioID = req.user.usuarioID;
        const pool = req.app.locals.db;
        const workbook = new ExcelJS.Workbook();

        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
            return res.status(400).json({ message: 'El archivo Excel no tiene hojas.' });
        }

        const newUsers = [];
        const errors = [];

        // Cache existing data for quick validation
        const existingData = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query("SELECT u, email, celular FROM usuario WHERE usuarioID = @usuarioID");

        const existingU = new Set(existingData.recordset.map(r => r.u.toLowerCase()));
        const existingEmail = new Set(existingData.recordset.filter(r => r.email).map(r => r.email.toLowerCase()));
        const existingCel = new Set(existingData.recordset.filter(r => r.celular).map(r => r.celular));

        // Get Max SubusuarioID
        const resultMax = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query("SELECT ISNULL(MAX(subusuarioID), 0) as maxId FROM usuario WHERE usuarioID = @usuarioID");

        let nextSubId = resultMax.recordset[0].maxId + 1;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const nombre = row.getCell(1).value ? String(row.getCell(1).value).trim() : null;
            const u = row.getCell(2).value ? String(row.getCell(2).value).trim() : null;
            const email = row.getCell(3).value ? String(row.getCell(3).value).trim() : null;
            const celular = row.getCell(4).value ? String(row.getCell(4).value).trim() : null;

            if (!nombre || !u || !celular) {
                // Skip empty rows or error? Let's skip empty, error invalid
                if (!nombre && !u && !celular) return;
                errors.push(`Fila ${rowNumber}: Faltan datos obligatorios (Nombre, Usuario, Celular).`);
                return;
            }

            // Validations
            if (existingU.has(u.toLowerCase())) {
                errors.push(`Fila ${rowNumber}: El usuario '${u}' ya existe.`);
            }
            if (email && existingEmail.has(email.toLowerCase())) {
                errors.push(`Fila ${rowNumber}: El email '${email}' ya existe.`);
            }
            // Validar duplicados en el MISMO archivo
            if (newUsers.some(nu => nu.u.toLowerCase() === u.toLowerCase())) {
                errors.push(`Fila ${rowNumber}: El usuario '${u}' está duplicado en el archivo.`);
            }

            // Simular inserción en conjuntos de validación (para detectar dups dentro del archivo si quisiéramos ser estrictos, pero el check de arriba 'newUsers.some' lo cubre parcialmente)

            if (errors.length === 0) {
                newUsers.push({
                    subusuarioID: nextSubId++,
                    nombre,
                    u,
                    email,
                    celular,
                    clave: '' // No password initially? Or default? Default empty string as per logic seen elsewhere
                });
            }
        });

        if (errors.length > 0) {
            return res.status(400).json({ message: 'Errores en la importación:<br>' + errors.slice(0, 5).join('<br>') + (errors.length > 5 ? '<br>...' : '') });
        }

        if (newUsers.length === 0) {
            return res.status(400).json({ message: 'No se encontraron usuarios válidos para importar.' });
        }

        // Batch Insert (Transaction would be better but keeping simple loop for MSSQL param limits usually)
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const user of newUsers) {
                const reqInsert = new sql.Request(transaction);
                // Hash default password if needed, or leave empty/dummy. 
                // Using empty string for now, user must set it later or we set a default.
                // Reusing '123456' hashed? Or just empty.
                const salt = await bcrypt.genSalt(10);
                const hashed = await bcrypt.hash('123456', salt); // Default password

                await reqInsert
                    .input('usuarioID', sql.Int, usuarioID)
                    .input('subusuarioID', sql.Int, user.subusuarioID)
                    .input('nombre', sql.VarChar(100), user.nombre)
                    .input('u', sql.VarChar(50), user.u)
                    .input('email', sql.VarChar(100), user.email || null)
                    .input('celular', sql.VarChar(20), user.celular)
                    .input('password', sql.VarChar(255), hashed)
                    .query(`INSERT INTO usuario (usuarioID, subusuarioID, nombre, u, email, celular, password, activo) 
                            VALUES (@usuarioID, @subusuarioID, @nombre, @u, @email, @celular, @password, 1)`);
            }

            await transaction.commit();
            res.json({ message: `Se importaron ${newUsers.length} colaboradores correctamente.` });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        logError('Error al importar usuarios:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});
