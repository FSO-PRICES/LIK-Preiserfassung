const fs = require('fs');
const Papa = require('papaparse');

const data = fs.readFileSync('./new_translations.csv', 'utf8');
const result = Papa.parse(data.substr(0, data.length - 1), { header: false })

createJsonFile('de', '1');
createJsonFile('en', '2');
createJsonFile('fr', '3');
createJsonFile('it', '4');

function createJsonFile(code, index) {
    var json = result.data
        .reduce((agg, v) => {
            agg[v['0']] = v[index];
            return agg;
        }, {});
    const origJson = JSON.parse(fs.readFileSync(`./${code}_orig.json`, 'utf8'));
    fs.writeFileSync(`./${code}.json`, JSON.stringify(Object.assign({}, origJson, json), null, 4), 'utf8');
}
