import * as bluebird from 'bluebird';
import * as request from 'request-promise';
import * as _ from 'lodash';
import * as docuri from 'docuri';

import { readFile, writeFile, readdir } from './promisified';

import { pmsUriRoute, preismeldungReferenceUriRoute } from '../lik-shared/common/models';

const [, , username, password] = process.argv;

const baseUrl = `http://${username}:${password}@localhost:5986`;

const pmsUri = docuri.route(pmsUriRoute);
const preismeldungReferenceUri = docuri.route(preismeldungReferenceUriRoute);

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
                    const erheber = _.assign({}, data.erheber, { _id: 'erheber' });
                    const preismeldestellen = data.preismeldestellen.map(x => (_.assign({}, x, { _id: pmsUri({ pmsNummer: x.pmsNummer }) })));
                    const products = data.preismeldungen.map(x => _.assign(x, { _id: preismeldungReferenceUri({ pmsNummer: x.pmsNummer, epNummer: x.epNummer, laufnummer: x.laufnummer }) }));
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

