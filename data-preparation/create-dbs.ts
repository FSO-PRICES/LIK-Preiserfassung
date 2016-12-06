import * as bluebird from 'bluebird';
import * as request from 'request-promise';
import * as _ from 'lodash';

import { readFile, writeFile, } from './promisified';

const [, , username, password] = process.argv;

const baseUrl = `http://${username}:${password}@localhost:5986`;

const files =  [
    { filename: 'Alphonse_Dupont', username: 'alphonse_dupont' },
    { filename: 'Germaine_Exemple', username: 'germaine_exemple' },
    { filename: 'Hans_Müller', username: 'hans_mueller' },
    { filename: 'Hansueli_Müller', username: 'hansueli_mueller' },
    { filename: 'Marie_Crétin', username: 'marie_cretin' },
    { filename: 'Nicole_Schmidt', username: 'nicole_schmidt' },
    { filename: 'Patrick_Muster', username: 'patrick_muster' },
    { filename: 'Peter_Muster', username: 'petra_muster' },
    { filename: 'Pierrette_Dupont', username: 'pierrette_dupont' },
    { filename: 'Pierrinne_Tabouret', username: 'pierrinne_tabouret' }
];

readFile('./warenkorb/flat.json')
    .then(x => JSON.parse(x.toString()))
    .then(warenkorbProducts => {
        return files.map(x => {
            const url = `${baseUrl}/${x.username}`;
            return request.del(url)
                .catch(() => {})
                .then(() => request.put(url))
                .then(() => request({
                    url: `${url}/_security`,
                    method: 'PUT',
                    json: {
                        admins: { names: [x.username], roles: [] },
                        members: { names: [], 'roles': [] } }
                }))
                .then(() => readFile(`./presta/erheber_${x.filename}.json`))
                .then(x => {
                    const data = JSON.parse(x.toString());
                    const erheber = _.assign(data.erheber, { _id: 'erheber' });
                    const preismeldestellen = data.preismeldestellen.map(x => _.assign(x, { _id: `preismeldestelle_${x.pmsKey}` }));
                    const products = data.products.map(x => _.assign(x, { _id: `product_${x.erhebungspositionsnummer}` }));
                    const warenkorb = {
                        _id: 'warenkorb',
                        products: warenkorbProducts
                    };
                    return request({
                        url: `${url}/_bulk_docs`,
                        method: 'POST',
                        json: {
                            docs: [erheber, ...preismeldestellen, ...products, warenkorb]
                        }
                    });
                });
        })
    });

