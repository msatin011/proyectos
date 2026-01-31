
// Exportar usuarios a Excel
app.get('/api/usuarios/exportar', authenticateToken, async (req, res) => {
    try {
        const usuarioID = req.user.usuarioID;
        const pool = req.app.locals.db;

        // Obtener datos
        const result = await pool.request()
            .input('usuarioID', sql.Int, usuarioID)
            .query(`SELECT subusuarioID, nombre, u, email, celular, activohasta 
                    FROM usuario 
                    WHERE usuarioID = @usuarioID 
                    ORDER BY subusuarioID`);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Usuarios');

        // Definir columnas
        worksheet.columns = [
            { header: 'Nro.', key: 'subusuarioID', width: 10 },
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Usuario Login', key: 'u', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Celular', key: 'celular', width: 20 },
            { header: 'Activo Hasta', key: 'activohasta', width: 15 }
        ];

        // Estilar cabecera
        worksheet.getRow(1).font = { bold: true };

        // Agregar filas
        result.recordset.forEach(user => {
            worksheet.addRow(user);
        });

        // Configurar respuesta
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Usuarios.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        logError('Error al exportar usuarios:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});
