import * as bluebird from 'bluebird';
import * as _ from 'lodash';
import * as _urlify from 'urlify';

const urlify = _urlify.create({ addEToUmlauts: true, toLower: true });

import { readFile, writeFile, } from '../promisified';
import { bufferToCells } from '../utils';

import { Erheber, Product, Preismeldestelle } from '../../common/models';

// interface Preisemeldestelle {
//     pmsKey: number;
//     name: string;
//     supplement: string;
//     street: string;
//     postcode: string;
//     town: string;
//     telephone: string;
//     email: string;
//     languageCode: string;
// }

// interface Erheber {
//     firstName: string;
//     surname: string;
//     personFunction: string;
//     languageCode: string;
//     telephone: string;
//     email: string;
// }

const pmsPreiserheberIndexes = {
    pmsKey: 0,
    pmsName: 1,
    pmsSupplement: 2,
    pmsStreet: 3,
    pmsPostcode: 4,
    pmsTown: 5,
    pmsTelephone: 6,
    pmsEmail: 7,
    pmsLanguageCode: 8,
    erheberFirstName: 9,
    erheberSurname: 10,
    erheberPersonFunction: 11,
    erheberLanguageCode: 12,
    erheberTelephone: 13,
    erheberEmail: 14
};

// interface Product {
//     pmsKey: number;
//     erhebungspositionsnummer: number;
//     laufnummer: number;
//     preisT: number;
//     mengeT: number;
//     aktionsCode: boolean;
//     ausverkauf: boolean;
//     preisGueltigSeit: Date;
//     text: string;
//     artikelNummer: string;
//     basispreise: number;
//     basismenge: number;
//     sonderpreis: number;
//     fehlendepreisCode: string;
//     bemerkungen: string;
//     tableInformationen: string;
//     preiseVorReduktion: number;
//     mengeVorReduktion: number;
//     preiseReiheIstZuBeenden: boolean;
//     produktMerkmal1: string;
//     produktMerkmal2: string;
//     produktMerkmal3: string;
//     produktMerkmal4: string;
//     produktMerkmal5: string;
// }


const productIndexes = {
    pmsKey: 1,
    erhebungspositionsnummer: 2,
    laufnummer: 3,
    preisT: 4,
    mengeT: 5,
    aktionsCode: 6,
    ausverkauf: 7,
    preisGueltigSeit: 8,
    text: 9,
    artikelNummer: 10,
    basispreise: 11,
    basismenge: 12,
    sonderpreis: 13,
    fehlendepreisCode: 14,
    bemerkungen: 15,
    tableInformationen: 16,
    preiseVorReduktion: 17,
    mengeVorReduktion: 18,
    preiseReiheIstZuBeenden: 19,
    produktMerkmal1: 20,
    produktMerkmal2: 21,
    produktMerkmal3: 22,
    produktMerkmal4: 23,
    produktMerkmal5: 24
}

readFile('./presta/data/PMS und Preiserheber.csv').then(bufferToCells)
    .then(lines => {
        const pmsErhebers = lines.map(cells => ({
            pms: <Preismeldestelle>{
                pmsKey: parseInt(cells[pmsPreiserheberIndexes.pmsKey]),
                name: cells[pmsPreiserheberIndexes.pmsName],
                supplement: cells[pmsPreiserheberIndexes.pmsSupplement],
                street: cells[pmsPreiserheberIndexes.pmsStreet],
                postcode: cells[pmsPreiserheberIndexes.pmsPostcode],
                town: cells[pmsPreiserheberIndexes.pmsTown],
                telephone: cells[pmsPreiserheberIndexes.pmsTelephone],
                email: cells[pmsPreiserheberIndexes.pmsEmail],
                languageCode: cells[pmsPreiserheberIndexes.pmsLanguageCode]
            },
            erheber: <Erheber>{
                firstName: cells[pmsPreiserheberIndexes.erheberFirstName],
                surname: cells[pmsPreiserheberIndexes.erheberSurname],
                personFunction: cells[pmsPreiserheberIndexes.erheberPersonFunction],
                languageCode: cells[pmsPreiserheberIndexes.erheberLanguageCode],
                telephone: cells[pmsPreiserheberIndexes.erheberTelephone],
                email: cells[pmsPreiserheberIndexes.erheberEmail]
            }
        }));
        const grouped = _.groupBy(pmsErhebers, x => `${x.erheber.firstName}_${x.erheber.surname}`);
        return Object.keys(grouped)
            .map(name => {
                const groups = grouped[name];
                return {
                    erheber: groups[0].erheber,
                    preismeldestellen: groups.map(x => x.pms)
                };
            });
    })
    .then(preismeldestellen => readFile('./presta/data/PRICES_PRESTA_BackOffice_12-2016.txt').then(bufferToCells).then(lines => ({ preismeldestellen, lines})))
    .then(data => {
        const products = data.lines.map(cells => (<Product>{
            pmsKey: parseInt(cells[productIndexes.pmsKey]),
            erhebungspositionsnummer: parseInt(cells[productIndexes.erhebungspositionsnummer]),
            laufnummer: parseInt(cells[productIndexes.laufnummer]),
            preisT: parseFloat(cells[productIndexes.preisT]),
            mengeT: parseFloat(cells[productIndexes.mengeT]),
            aktionsCode: cells[productIndexes.aktionsCode] === '1',
            ausverkauf: cells[productIndexes.ausverkauf] === '1',
            text: cells[productIndexes.text],
            artikelNummer: cells[productIndexes.artikelNummer],
            basispreise: parseFloat(cells[productIndexes.basispreise]),
            basismenge: parseFloat(cells[productIndexes.basismenge]),
            sonderpreis: parseFloat(cells[productIndexes.sonderpreis]),
            fehlendepreisCode: cells[productIndexes.fehlendepreisCode],
            bemerkungen: cells[productIndexes.bemerkungen],
            tableInformationen: cells[productIndexes.tableInformationen],
            preiseVorReduktion: parseFloat(cells[productIndexes.preiseVorReduktion]),
            mengeVorReduktion: parseFloat(cells[productIndexes.mengeVorReduktion]),
            preiseReiheIstZuBeenden: cells[productIndexes.preiseReiheIstZuBeenden] === '1',
            produktMerkmal1: cells[productIndexes.produktMerkmal1],
            produktMerkmal2: cells[productIndexes.produktMerkmal2],
            produktMerkmal3: cells[productIndexes.produktMerkmal3],
            produktMerkmal4: cells[productIndexes.produktMerkmal4],
            produktMerkmal5: cells[productIndexes.produktMerkmal5]
        }));

        return data.preismeldestellen.map(x => {
            const pmsKeys = x.preismeldestellen.map(y => y.pmsKey);
            return {
                erheber: x.erheber,
                preismeldestellen: _.sortBy(x.preismeldestellen, [x => x.pmsKey]),
                products: _.sortBy(products.filter(y => pmsKeys.some(z => z == y.pmsKey)), [x => x.pmsKey, x => x.erhebungspositionsnummer, x => x.laufnummer])
            };
        });
    })
    .then(data => {
        const promises = data.map(x => writeFile(`./presta/erheber__${urlify(`${x.erheber.firstName}_${x.erheber.surname}`)}.json`, JSON.stringify(x)));
        return bluebird.all(promises);
    })

