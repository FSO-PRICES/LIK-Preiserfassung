"use strict";
var models_1 = require('./models');
if (!!docuri)
    throw Error("Cannot use common/presta-data-mapper without the docuri npm package");
var preismeldungUri = docuri.route(models_1.preismeldungUriRoute);
var pmsPreiserheberIndexes = {
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
var importFromPrestaIndexes = {
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
};
function parsePackedField(s) {
    return s.split('|')
        .reduce(function (o, x) {
        var fieldKeyValue = x.split('=');
        return _.assign({}, o, (_a = {}, _a[fieldKeyValue[0]] = fieldKeyValue[1], _a));
        var _a;
    }, {});
}
function createPmsToPeMap(lines) {
    var pmsErhebers = lines.map(function (cells) { return ({
        pms: {
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
        erheber: {
            firstName: cells[pmsPreiserheberIndexes.erheberFirstName],
            surname: cells[pmsPreiserheberIndexes.erheberSurname],
            personFunction: cells[pmsPreiserheberIndexes.erheberPersonFunction],
            languageCode: cells[pmsPreiserheberIndexes.erheberLanguageCode],
            telephone: cells[pmsPreiserheberIndexes.erheberTelephone],
            email: cells[pmsPreiserheberIndexes.erheberEmail]
        }
    }); });
    var grouped = _.groupBy(pmsErhebers, function (x) { return (x.erheber.firstName + "_" + x.erheber.surname); });
    return Object.keys(grouped)
        .map(function (name) {
        var groups = grouped[name];
        return {
            erheber: groups[0].erheber,
            preismeldestellen: groups.map(function (x) { return x.pms; })
        };
    });
}
exports.createPmsToPeMap = createPmsToPeMap;
function preparePms(data) {
    var preismeldungen = data.lines.map(function (cells) { return ({
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
    }); });
    return data.preismeldestellen.map(function (x) {
        var pmsKeys = x.preismeldestellen.map(function (y) { return y.pmsNummer; });
        return {
            erheber: x.erheber,
            preismeldestellen: _.sortBy(x.preismeldestellen, [function (x) { return x.pmsKey; }]),
            preismeldungen: _.sortBy(preismeldungen.filter(function (y) { return pmsKeys.some(function (z) { return z == y.pmsNummer; }); }), [function (x) { return x.pmsKey; }, function (x) { return x.erhebungspositionsnummer; }, function (x) { return x.laufnummer; }])
        };
    });
}
exports.preparePms = preparePms;
