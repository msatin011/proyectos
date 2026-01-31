const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'PROYECTOS_APP', 'sass-tareas', 'server.js');
const backupPath = filePath + '.bak';

try {
    const data = fs.readFileSync(filePath, 'utf8');
    // Create backup
    fs.writeFileSync(backupPath, data);

    const lines = data.split(/\r?\n/);
    console.log(`Total lines before: ${lines.length}`);

    // Ranges to remove (1-based inclusive)
    // Range 2: 791-810 (Remove first to specific indices won't change)
    // Range 1: 144-165

    // Convert to 0-based exclusive
    // Remove 791-810 (lines[790] to lines[809])
    const start2 = 790;
    const end2 = 810; // Splice delete count = 810 - 790 = 20

    // Remove 144-165 (lines[143] to lines[164])
    const start1 = 143;
    const end1 = 165; // Splice delete count = 165 - 143 = 22

    // Verification
    console.log(`Line 144 Content: ${lines[143]}`);
    console.log(`Line 791 Content: ${lines[790]}`);

    if (!lines[143].includes('FROM menu')) {
        console.error("Line 144 does not look like 'FROM menu'. Aborting.");
        process.exit(1);
    }
    if (!lines[790].includes('FROM menu')) {
        console.error("Line 791 does not look like 'FROM menu'. Aborting.");
        process.exit(1);
    }

    // Remove logic: Sort ranges descending to keep indices valid
    // Remove Range 2
    lines.splice(start2, end2 - start2);
    // Remove Range 1
    lines.splice(start1, end1 - start1);

    const newData = lines.join('\r\n'); // Use Windows line ending
    fs.writeFileSync(filePath, newData);
    console.log(`Total lines after: ${lines.length}`);
    console.log('Successfully removed garbage lines.');

} catch (err) {
    console.error('Error:', err);
}
