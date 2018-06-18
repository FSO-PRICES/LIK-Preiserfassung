const fs = require('fs');
const Papa = require('papaparse');

const data = fs.readFileSync('./translations.csv', 'utf8');
const result = Papa.parse(data.substr(0, data.length - 1), { header: false });

const typescript = `${createTypescript('de', '1')}\n\n${createTypescript('en', '2')}\n\n${createTypescript(
    'fr',
    '3'
)}\n\n${createTypescript('it', '4')}\n`;
// const typescript = `${createTypescript('it', '4')}\n`;
fs.writeFileSync('translations.ts', typescript, 'utf8');

function createTypescript(code, index) {
    return `export const ${code} = {\n${result.data
        .map(v => `    '${v['0']}': '${v[index].replace(/'/g, `\\'`)}'`)
        .join(',\n')}\n};`;
}

function createTypescriptKeys(code) {
    return `export const ${code} = {\n${result.data.map(v => `    '${v['0']}': '${v['0']}'`).join(',\n')}\n};`;
}
