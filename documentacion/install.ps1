# install.ps1
$root = "C:\vencimientos-agent"
$zipPath = "C:\vencimientos-agent.zip"

# Crear estructura de carpetas
New-Item -ItemType Directory -Path "$root\config" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\agents" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\utils" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\logs" -Force | Out-Null

# Lista de archivos y su contenido
$files = @{
    "$root\config\db.js" = @'
// config/db.js
const sql = require('mssql');

const config = {
    user: 'tu_usuario_sql',
    password: 'tu_contraseña_sql',
    server: 'localhost',
    database: 'tu_base_de_datos',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

module.exports = config;
'@

    "$root\agents\afip.js" = @'
// agents/afip.js
const axios = require('axios');
const cheerio = require('cheerio');
const sql = require('mssql');
const config = require('../config/db');

async function scrapeAFIP() {
    console.log('🔍 Iniciando agente AFIP...');
    try {
        const { data } = await axios.get('https://www.afip.gob.ar/vencimientos/', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);

        await sql.connect(config);
        const request = new sql.Request();
        const idJurisdiccion = 1;

        await request.query(`
            DELETE FROM vencimientos 
            WHERE id_jurisdiccion = ${idJurisdiccion} 
            AND frecuencia IN ('mensual', 'trimestral', 'anual')
        `);

        $('table tbody tr').each((i, row) => {
            const cols = $(row).find('td');
            if (cols.length >= 3) {
                let concepto = $(cols[0]).text().trim();
                const vencimiento = $(cols[1]).text().trim();
                let observaciones = $(cols[2]).text().trim();

                concepto = concepto.replace(/'/g, "''");
                observaciones = observaciones.replace(/'/g, "''");

                let frecuencia = 'variable';
                let dia = null;

                if (vencimiento.includes('de cada mes')) {
                    frecuencia = 'mensual';
                    const match = vencimiento.match(/(\d+)/);
                    if (match) dia = parseInt(match[1]);
                } else if (vencimiento.toLowerCase().includes('trimestral')) {
                    frecuencia = 'trimestral';
                } else if (vencimiento.toLowerCase().includes('anual')) {
                    frecuencia = 'anual';
                }

                request.query(`
                    INSERT INTO vencimientos (
                        id_jurisdiccion, nombre_obligacion, tipo, frecuencia,
                        mes_vencimiento, dia_vencimiento, fuente_url, observaciones
                    ) VALUES (
                        ${idJurisdiccion}, 
                        '${concepto}',
                        'impuesto',
                        '${frecuencia}',
                        NULL,
                        ${dia === null ? 'NULL' : dia},
                        'https://www.afip.gob.ar/vencimientos/',
                        '${observaciones}'
                    )
                `);
            }
        });

        await request.query(`
            UPDATE jurisdicciones 
            SET ultimo_relevamiento = GETDATE() 
            WHERE id_jurisdiccion = ${idJurisdiccion}
        `);

        console.log('✅ AFIP: vencimientos actualizados.');
        await sql.close();
    } catch (err) {
        console.error('❌ Error en agente AFIP:', err.message);
        if (sql.pool) await sql.close();
        throw err;
    }
}

if (require.main === module) {
    scrapeAFIP().catch(console.error);
}

module.exports = scrapeAFIP;
'@

    "$root\agents\arba.js" = @'
// agents/arba.js
const axios = require('axios');
const cheerio = require('cheerio');
const sql = require('mssql');
const config = require('../config/db');

async function scrapeARBA() {
    console.log('🔍 Iniciando agente ARBA...');
    try {
        const { data } = await axios.get('https://www.arba.gov.ar/Calendario/Calendario.asp', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);

        await sql.connect(config);
        const request = new sql.Request();
        const idJurisdiccion = 2;

        await request.query(`
            DELETE FROM vencimientos 
            WHERE id_jurisdiccion = ${idJurisdiccion} 
            AND frecuencia IN ('mensual', 'trimestral', 'anual')
        `);

        $('table').each((_, table) => {
            $(table).find('tr').each((__, row) => {
                const cols = $(row).find('td');
                if (cols.length >= 2) {
                    const diaTexto = $(cols[0]).text().trim();
                    let concepto = $(cols[1]).text().trim();

                    const dia = parseInt(diaTexto);
                    if (!isNaN(dia) && dia > 0 && dia <= 31 && concepto) {
                        concepto = concepto.replace(/'/g, "''");
                        request.query(`
                            INSERT INTO vencimientos (
                                id_jurisdiccion, nombre_obligacion, tipo, frecuencia,
                                dia_vencimiento, fuente_url
                            ) VALUES (
                                ${idJurisdiccion},
                                '${concepto}',
                                'impuesto',
                                'mensual',
                                ${dia},
                                'https://www.arba.gov.ar/Calendario/Calendario.asp'
                            )
                        `);
                    }
                }
            });
        });

        await request.query(`
            UPDATE jurisdicciones 
            SET ultimo_relevamiento = GETDATE() 
            WHERE id_jurisdiccion = ${idJurisdiccion}
        `);

        console.log('✅ ARBA: vencimientos actualizados.');
        await sql.close();
    } catch (err) {
        console.error('❌ Error en agente ARBA:', err.message);
        if (sql.pool) await sql.close();
        throw err;
    }
}

if (require.main === module) {
    scrapeARBA().catch(console.error);
}

module.exports = scrapeARBA;
'@

    "$root\agents\feriados.js" = @'
// agents/feriados.js
const axios = require('axios');
const cheerio = require('cheerio');
const sql = require('mssql');
const config = require('../config/db');

async function scrapeFeriados() {
    console.log('🔍 Iniciando agente de feriados...');
    try {
        const { data } = await axios.get('https://www.argentina.gob.ar/interior/feriados', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);

        await sql.connect(config);
        const request = new sql.Request();
        const currentYear = new Date().getFullYear();

        await request.query(`
            DELETE FROM feriados_nacionales 
            WHERE YEAR(fecha) IN (${currentYear}, ${currentYear + 1})
        `);

        const meses = {
            'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
            'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
            'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
        };

        $('table tbody tr').each((_, row) => {
            const cols = $(row).find('td');
            if (cols.length >= 3) {
                const fechaStr = $(cols[0]).text().trim();
                let descripcion = $(cols[1]).text().trim();
                const tipoTexto = $(cols[2]).text().trim().toLowerCase();
                const tipo = tipoTexto.includes('inamovible') ? 'inamovible' : 'trasladable';

                const match = fechaStr.match(/(\d+)\s+de\s+(\w+)/i);
                if (match) {
                    const dia = match[1].padStart(2, '0');
                    const mesNombre = match[2].toLowerCase();
                    const mes = meses[mesNombre];
                    if (mes) {
                        const fechaSQL = `${currentYear}-${mes}-${dia}`;
                        descripcion = descripcion.replace(/'/g, "''");
                        request.query(`
                            IF NOT EXISTS (SELECT 1 FROM feriados_nacionales WHERE fecha = '${fechaSQL}')
                            INSERT INTO feriados_nacionales (fecha, descripcion, tipo)
                            VALUES ('${fechaSQL}', '${descripcion}', '${tipo}')
                        `);
                    }
                }
            }
        });

        await request.query(`
            UPDATE jurisdicciones 
            SET ultimo_relevamiento = GETDATE() 
            WHERE codigo = 'FERIADOS'
        `);

        console.log('✅ Feriados actualizados.');
        await sql.close();
    } catch (err) {
        console.error('❌ Error en feriados:', err.message);
        if (sql.pool) await sql.close();
        throw err;
    }
}

if (require.main === module) {
    scrapeFeriados().catch(console.error);
}

module.exports = scrapeFeriados;
'@

    "$root\utils\dateUtils.js" = @'
// utils/dateUtils.js
module.exports = {
    esFinDeSemana(fecha) {
        const day = fecha.getDay();
        return day === 0 || day === 6;
    },
    sumarDiasHabiles(fecha, dias) {
        let fechaActual = new Date(fecha);
        while (dias > 0) {
            fechaActual.setDate(fechaActual.getDate() + 1);
            if (!this.esFinDeSemana(fechaActual)) {
                dias--;
            }
        }
        return fechaActual;
    }
};
'@

    "$root\main.js" = @'
// main.js
const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFile = path.join(logDir, `run_${new Date().toISOString().slice(0, 10)}.log`);

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(line.trim());
  fs.appendFileSync(logFile, line);
}

async function main() {
  log("=== INICIO DEL RELEVAMIENTO DIARIO ===");
  try {
    await require("./agents/afip")();
    await require("./agents/arba")();
    await require("./agents/feriados")();
    log("✅ Todos los agentes completados con éxito.");
  } catch (err) {
    log(`❌ Error crítico: ${err.message}`);
  }
  log("=== FIN DEL PROCESO ===");
}

if (require.main === module) {
  main().catch(console.error);
}
'@

    "$root\package.json" = @'
{
  "name": "vencimientos-agent",
  "version": "1.0.0",
  "description": "Agente de relevamiento automático de vencimientos tributarios en Argentina",
  "main": "main.js",
  "scripts": {
    "start": "node main.js"
  },
  "dependencies": {
    "axios": "^1.7.7",
    "cheerio": "^1.0.0-rc.12",
    "mssql": "^10.0.3"
  }
}
'@

    "$root\setup-db.sql" = @'
CREATE TABLE jurisdicciones (
    id_jurisdiccion INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    tipo NVARCHAR(20) CHECK (tipo IN (''nacion'', ''provincia'', ''municipio'')) NOT NULL,
    codigo NVARCHAR(20) UNIQUE NOT NULL,
    url_vencimientos NVARCHAR(500),
    metodo_extraccion NVARCHAR(30) DEFAULT ''html'',
    activo BIT DEFAULT 1,
    ultimo_relevamiento DATETIME2
);

CREATE TABLE feriados_nacionales (
    id_feriado INT IDENTITY(1,1) PRIMARY KEY,
    fecha DATE UNIQUE NOT NULL,
    descripcion NVARCHAR(255),
    tipo NVARCHAR(20)
);

CREATE TABLE vencimientos (
    id_vencimiento INT IDENTITY(1,1) PRIMARY KEY,
    id_jurisdiccion INT NOT NULL FOREIGN KEY REFERENCES jurisdicciones(id_jurisdiccion),
    nombre_obligacion NVARCHAR(255) NOT NULL,
    tipo NVARCHAR(50),
    frecuencia NVARCHAR(20),
    mes_vencimiento INT,
    dia_vencimiento INT,
    fecha_vencimiento_real DATE,
    fuente_url NVARCHAR(500),
    fecha_relevamiento DATETIME2 DEFAULT GETDATE(),
    estado NVARCHAR(20) DEFAULT ''activo'' CHECK (estado IN (''activo'', ''vencido'', ''obsoleto'')),
    observaciones NVARCHAR(1000)
);

CREATE INDEX IX_vencimientos_fecha_real ON vencimientos(fecha_vencimiento_real);
CREATE INDEX IX_vencimientos_jurisdiccion ON vencimientos(id_jurisdiccion);

INSERT INTO jurisdicciones (nombre, tipo, codigo, url_vencimientos, metodo_extraccion)
VALUES
(''Administración Federal de Ingresos Públicos'', ''nacion'', ''AFIP'', ''https://www.afip.gob.ar/vencimientos/'', ''html''),
(''Agencia de Recaudación de la Prov. de Bs. As.'', ''provincia'', ''ARBA'', ''https://www.arba.gov.ar/Calendario/Calendario.asp'', ''html''),
(''Feriados Nacionales'', ''nacion'', ''FERIADOS'', ''https://www.argentina.gob.ar/interior/feriados'', ''scraping'');
'@
}

# Guardar cada archivo
foreach ($file in $files.Keys) {
    Set-Content -Path $file -Value $files[$file] -Encoding UTF8
}

# Crear ZIP
Compress-Archive -Path "$root\*" -DestinationPath $zipPath -Force

Write-Host "✅ ¡Listo! El archivo ZIP se creó en: $zipPath" -ForegroundColor Green
Write-Host "➡️  Siguiente paso: descomprimir, editar config/db.js y ejecutar 'npm install'" -ForegroundColor Yellow