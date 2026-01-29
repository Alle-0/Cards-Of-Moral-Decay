const fs = require('fs');
const path = require('path');
const texturesDir = path.join(__dirname, 'assets', 'textures');

const files = fs.readdirSync(texturesDir);
files.forEach(file => {
    if (file.endsWith('.png')) {
        const filePath = path.join(texturesDir, file);
        const buffer = fs.readFileSync(filePath, { encoding: null });
        console.log(`${file}: ${buffer.slice(0, 16).toString('hex')} | "${buffer.slice(0, 16).toString('utf8').replace(/[^ -~]/g, '.')}"`);
    }
});
