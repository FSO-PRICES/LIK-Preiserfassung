const fs = require('fs');
const { parse } = require('json2csv');
const translations = require('../to-translate.json');

try {
    Object.entries(translations).forEach(([lang, translations]) => {
        console.log(`Writing translation for '${lang}'`);
        const values = Object.entries(translations).reduce(
            (acc, [NAME, WERT]) => [
                ...acc,
                {
                    NAME,
                    WERT,
                },
            ],
            [],
        );
        const csv = parse(values, {});
        fs.writeFileSync(`translations-${lang}.csv`, csv);
    });
} catch (err) {
    console.error(err);
}
