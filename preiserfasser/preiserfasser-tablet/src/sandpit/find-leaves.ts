declare var require: any;

const fs = require('fs');
const os = require('os');
const bluebird = require('bluebird');

const readFile = bluebird.promisify(fs.readFile);

interface NameTranslation {
    [lang: string]: string;
}

interface Product {
    code: string;
    parent: string;
    level: string;
    name: NameTranslation;
    parentName: NameTranslation;
    grandparentName: NameTranslation;
}

parseFile()
    .then(products => findLeaves(products))
    .then(leaves => {
        fs.writeFileSync('./src/sandpit/products.json', JSON.stringify(leaves));
        console.log(`written ${leaves.length} leaves`);
    });

function findLeaves(products: Product[]) {
    return products
        .filter(p => !products.some(x => x.parent === p.code))
        .map(p => {
            const { code, parent, level, name } = p;
            const parentProduct = products.filter(x => x.code === p.parent)[0];
            const parentName = parentProduct ? parentProduct.name : {};
            let grandparentName = {};
            if (!!parentProduct) {
                const grandparentProduct = products.filter(x => x.code === parentProduct.parent)[0];
                grandparentName = grandparentProduct ? grandparentProduct.name : {};
            }
            return {
                code,
                parent,
                level,
                name,
                parentName,
                grandparentName,
                priceThisMonth: null,
                priceLastMonth: null
            };
        });
}

function parseFile() {
    return readFile('./src/sandpit/metastat_2.0.txt')
        .then(data => {
            const lines: string[] = data.toString().split(os.EOL);
            return lines.slice(1).map(x => {
                const lineSplitted = x.split(';');
                const code = cleanQuotes(lineSplitted[0]);
                const parent = cleanQuotes(lineSplitted[1]);
                const level = cleanQuotes(lineSplitted[2]);
                const en = cleanQuotes(lineSplitted[3]);
                const de = cleanQuotes(lineSplitted[4]);
                const fr = cleanQuotes(lineSplitted[5]);
                const it = cleanQuotes(lineSplitted[6]);
                return {
                    code,
                    parent,
                    level,
                    name: { en, de, fr, it }
                };
            });
        });
}

function cleanQuotes(s: string) {
    return !s ? null : s.substring(1, s.length - 1);
}

