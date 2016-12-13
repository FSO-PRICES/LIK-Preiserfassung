import * as bluebird from 'bluebird';
import * as request from 'request-promise';
import * as _ from 'lodash';
import * as docuri from 'docuri';

import { readFile, writeFile, readdir } from './promisified';

const [, , username, password] = process.argv;

const baseUrl = `http://${username}:${password}@localhost:5986`;

const productUri = docuri.route('product/:productKey');
const pmsUri = docuri.route('preismeldestelle/:pmsKey');

const filenameRegex = /erheber__(.*?)\.json/;

readFile('./warenkorb/flat.json')
    .then(x => JSON.parse(x.toString()))
    .then(warenkorbProducts => readdir('./presta/').then(files => files.filter(x => !!x.match(filenameRegex))).then(files => ({ warenkorbProducts, files })))
    .then(x => {
        return x.files.map(filename => {
            const username = filename.match(filenameRegex)[1];
            const url = `${baseUrl}/${username}`;
            return request.del(url)
                .catch(() => {})
                .then(() => request.put(url))
                .then(() => request({
                    url: `${url}/_security`,
                    method: 'PUT',
                    json: {
                        admins: { names: [username], roles: [] },
                        members: { names: [], 'roles': [] } }
                }))
                .then(() => readFile(`./presta/erheber__${username}.json`))
                .then(buffer => {
                    const data = JSON.parse(buffer.toString());
                    const erheber = _.assign(data.erheber, { _id: 'erheber' });
                    const preismeldestellen = data.preismeldestellen.map(x => _.assign(x, { _id: pmsUri({ pmsKey: x.pmsKey }) }));
                    const products = data.products.map(x => _.assign(x, { _id: productUri({ productKey: x.erhebungspositionsnummer }) }));
                    const warenkorb = {
                        _id: 'warenkorb',
                        products: x.warenkorbProducts
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

