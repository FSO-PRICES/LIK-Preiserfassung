import * as bluebird from 'bluebird';
import * as _ from 'lodash';
import * as _urlify from 'urlify';
import * as docuri from 'docuri';

const urlify = _urlify.create({ addEToUmlauts: true, toLower: true });

import { readFile, writeFile, } from '../promisified';
import { bufferToCells } from '../utils';

import { Erheber, PreismeldungReferenceProperties, Preismeldung, Preismeldestelle, preismeldungUriRoute } from '../../common/models';

const preismeldungUri = docuri.route(preismeldungUriRoute);

const pmsPreiserheberIndexes = {
    pmsNummer: 0,
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

const importFromPrestaIndexes = {
    pmsNummer: 1,
    epNummer: 2,
    laufnummer: 3,
    preisT: 4,
    mengeT: 5,
    aktionsCode: 6,
    ausverkauf: 7,
    preisGueltigSeitDatum: 8,
    text: 9,
    artikelNummer: 10,
    basispreise: 11,
    basismenge: 12,
    sonderpreis: 13,
    fehlendePreisR: 14,
    bemerkungen: 15,
    tabletInformationen: 16,
    preiseVorReduktion: 17,
    mengeVorReduktion: 18,
    istPreisreiheZuBeenden: 19,
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
                pmsNummer: cells[pmsPreiserheberIndexes.pmsNummer],
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
    .then(preismeldestellen => readFile('./presta/data/PRICES_PRESTA_BackOffice_12-2016.txt').then(bufferToCells).then(lines => ({ preismeldestellen, lines })))
    .then(data => {
        const preismeldungen = data.lines.map(cells => (<PreismeldungReferenceProperties>{
            pmId: preismeldungUri({ pmsNummer: cells[importFromPrestaIndexes.pmsNummer], epNummer: cells[importFromPrestaIndexes.epNummer], laufnummer: cells[importFromPrestaIndexes.laufnummer] }),
            pmsNummer: cells[importFromPrestaIndexes.pmsNummer],
            epNummer: cells[importFromPrestaIndexes.epNummer],
            laufnummer: cells[importFromPrestaIndexes.laufnummer],
            preis: parseFloat(cells[importFromPrestaIndexes.preisT]),
            menge: parseFloat(cells[importFromPrestaIndexes.mengeT]),
            isAktion: cells[importFromPrestaIndexes.aktionsCode] === '1',
            isAusverkauf: cells[importFromPrestaIndexes.ausverkauf] === '1',
            preisGueltigSeitDatum: cells[importFromPrestaIndexes.preisGueltigSeitDatum],
            fehlendePreiseR: cells[importFromPrestaIndexes.fehlendePreisR],
            istPreisreiheZuBeenden: cells[importFromPrestaIndexes.istPreisreiheZuBeenden] === '1',
            zeitbereichPos: parseInt(parsePackedField(cells[importFromPrestaIndexes.tabletInformationen]).zeitPos),
            sortierungsnummer: parseInt(parsePackedField(cells[importFromPrestaIndexes.tabletInformationen]).sortNr),
            productMerkmale: [
                cells[importFromPrestaIndexes.produktMerkmal1],
                cells[importFromPrestaIndexes.produktMerkmal2],
                cells[importFromPrestaIndexes.produktMerkmal3],
                cells[importFromPrestaIndexes.produktMerkmal4],
                cells[importFromPrestaIndexes.produktMerkmal5]
            ],
            artikelnummer: cells[importFromPrestaIndexes.artikelNummer],
            artikeltext: cells[importFromPrestaIndexes.text],
            bermerkungenVomBfs: cells[importFromPrestaIndexes.bemerkungen]
        }));

        return data.preismeldestellen.map(x => {
            const pmsKeys = x.preismeldestellen.map(y => y.pmsNummer);
            return {
                erheber: x.erheber,
                preismeldestellen: _.sortBy(x.preismeldestellen, [x => x.pmsKey]),
                preismeldungen: _.sortBy(preismeldungen.filter(y => pmsKeys.some(z => z == y.pmsNummer)), [x => x.pmsKey, x => x.erhebungspositionsnummer, x => x.laufnummer])
            };
        });
    })
    .then(data => {
        const promises = data.map(x => writeFile(`./presta/erheber__${urlify(`${x.erheber.firstName}_${x.erheber.surname}`)}.json`, JSON.stringify(x)));
        return bluebird.all(promises);
    })

function parsePackedField(s: string): any {
    return s.split('|')
        .reduce((o, x) => {
            const fieldKeyValue = x.split('=');
            return _.assign({}, o, { [fieldKeyValue[0]]: fieldKeyValue[1] });
        }, {});
}
