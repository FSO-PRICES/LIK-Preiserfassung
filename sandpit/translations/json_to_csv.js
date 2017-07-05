const fs = require('fs');

fs.readFile('./preiserfasser/preiserfasser-tablet/src/assets/i18n/de.json', (err, data) => {
    const translations = JSON.parse(data);
    const lines = Object.keys(translations).map(key => `"${key}";"${translations[key].replace('"', '""')}";;;`);
    fs.writeFile('./translations.csv', ['key;DE;EN;FR;IT'].concat(lines).join('\n'), 'utf8', (err, data) => console.log('done'));
});
