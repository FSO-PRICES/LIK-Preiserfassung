const fs = require('fs');

const getValue = (obj, key) => !obj[key] ? '' : obj[key].replace('"', '""');

const deData = JSON.parse(fs.readFileSync('./de.json', 'utf8'));
const enData = JSON.parse(fs.readFileSync('./en.json', 'utf8'));
const frData = JSON.parse(fs.readFileSync('./fr.json', 'utf8'));
const itData = JSON.parse(fs.readFileSync('./it.json', 'utf8'));

const lines = Object.keys(deData).map(key => `"${key}";"${getValue(deData, key)}";${getValue(enData, key)};${getValue(frData, key)};${getValue(itData, key)}`);
fs.writeFile('./translations.csv', ['key;DE;EN;FR;IT'].concat(lines).join('\n'), 'utf8', (err, data) => console.log('done'));
