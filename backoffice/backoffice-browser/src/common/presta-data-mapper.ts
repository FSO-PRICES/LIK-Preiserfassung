import * as _ from 'lodash';
import * as docuri from 'docuri';
import { keyBy } from 'lodash';

import * as P from 'lik-shared';

import { toCsv } from '../common/file-extensions';

enum LanguageMap {
    de = 1,
    fr = 2,
    it = 3,
    en = 4,
}

const importPmsFromPrestaIndexes = {
    erhebungsmonat: 0,
    preissubsystem: 1,
    pmsNummer: 2,
    pmsName: 3,
    pmsZusatzname: 4,
    pmsStrasse: 5,
    pmsPlz: 6,
    pmsOrt: 7,
    pmsTelefon: 8,
    pmsEMail: 9,
    pmsSprache: 10,
    pmsErhebungsregion: 11,
    pmsErhebungsart: 12,
    pmsGeschlossen: 13,
    bemerkungZurErhebungsart: 14,
    pmsZusatzinformationen: 15,
    kp1Oid: 16,
    kp1Vorname: 17,
    kp1Name: 18,
    kp1Funktion: 19,
    kp1Telefon: 20,
    kp1Mobile: 21,
    kp1Fax: 22,
    kp1EMail: 23,
    kp1Sprache: 24,
    kp2Oid: 25,
    kp2Vorname: 26,
    kp2Name: 27,
    kp2Funktion: 28,
    kp2Telefon: 29,
    kp2Mobile: 30,
    kp2Fax: 31,
    kp2EMail: 32,
    kp2Sprache: 33,
};

const importPmFromPrestaIndexes = {
    erhebungsmonat: 0,
    preissubsystem: 1,
    schemanummer: 2,
    pmsNummer: 3,
    epNummer: 4,
    laufnummer: 5,
    preisT: 6,
    mengeT: 7,
    aktionsCode: 8,
    text: 9,
    artikelNummer: 10,
    preisGueltigSeitDatum: 11,
    basispreis: 12,
    basismenge: 13,
    fehlendePreisR: 14,
    notiz: 15,
    bemerkungen: 16,
    internetLink: 17,
    erhebungsZeitpunkt: 18,
    erhebungsAnfangsDatum: 19,
    erhebungsEndDatum: 20,
    sortierungsnummer: 21,
    preisVorReduktion: 22,
    mengeVorReduktion: 23,
    datumVorReduktion: 24,
    produktMerkmale: 25,
};

function parseProduktMerkmale(content: string) {
    if (!content) {
        return [];
    }
    const merkmale = content.split(';');
    const lastValueIndex = _.findLastIndex(merkmale, merkmal => !!merkmal && merkmal.trim() !== '');
    return merkmale.slice(0, lastValueIndex + 1).map(x => (x === '' ? null : x));
}

function parseKontaktPersons(cells: string[]) {
    return <P.Models.KontaktPerson[]>[
        {
            oid: cells[importPmsFromPrestaIndexes.kp1Oid],
            firstName: cells[importPmsFromPrestaIndexes.kp1Vorname],
            surname: cells[importPmsFromPrestaIndexes.kp1Name],
            personFunction: cells[importPmsFromPrestaIndexes.kp1Funktion],
            telephone: cells[importPmsFromPrestaIndexes.kp1Telefon],
            mobile: cells[importPmsFromPrestaIndexes.kp1Mobile],
            fax: cells[importPmsFromPrestaIndexes.kp1Fax],
            email: cells[importPmsFromPrestaIndexes.kp1EMail],
            languageCode: parseLanguageCode(cells[importPmsFromPrestaIndexes.kp1Sprache]),
        },
        {
            oid: cells[importPmsFromPrestaIndexes.kp2Oid],
            firstName: cells[importPmsFromPrestaIndexes.kp2Vorname],
            surname: cells[importPmsFromPrestaIndexes.kp2Name],
            personFunction: cells[importPmsFromPrestaIndexes.kp2Funktion],
            telephone: cells[importPmsFromPrestaIndexes.kp2Telefon],
            mobile: cells[importPmsFromPrestaIndexes.kp2Mobile],
            fax: cells[importPmsFromPrestaIndexes.kp2Fax],
            email: cells[importPmsFromPrestaIndexes.kp2EMail],
            languageCode: parseLanguageCode(cells[importPmsFromPrestaIndexes.kp2Sprache]),
        },
    ];
}

export function preparePms(lines: string[][]) {
    const preismeldestellen = lines.map(cells => {
        const id = P.preismeldestelleId(cells[importPmsFromPrestaIndexes.pmsNummer]);
        return <P.Models.Preismeldestelle>{
            _id: id,
            _rev: undefined,
            preissubsystem: parseNumber(cells[importPmsFromPrestaIndexes.preissubsystem], 'preissubsystem'),
            pmsNummer: cells[importPmsFromPrestaIndexes.pmsNummer],
            name: cells[importPmsFromPrestaIndexes.pmsName],
            supplement: cells[importPmsFromPrestaIndexes.pmsZusatzname],
            street: cells[importPmsFromPrestaIndexes.pmsStrasse],
            postcode: cells[importPmsFromPrestaIndexes.pmsPlz],
            town: cells[importPmsFromPrestaIndexes.pmsOrt],
            telephone: cells[importPmsFromPrestaIndexes.pmsTelefon],
            email: cells[importPmsFromPrestaIndexes.pmsEMail],
            languageCode: parseLanguageCode(cells[importPmsFromPrestaIndexes.pmsSprache]),
            erhebungsart: cells[importPmsFromPrestaIndexes.pmsErhebungsart],
            erhebungsartComment: parseNewlinesInText(cells[importPmsFromPrestaIndexes.bemerkungZurErhebungsart]),
            pmsGeschlossen: parsePmsGeschlossen(cells[importPmsFromPrestaIndexes.pmsGeschlossen]),
            erhebungsregion: cells[importPmsFromPrestaIndexes.pmsErhebungsregion],
            zusatzInformationen: parseNewlinesInText(cells[importPmsFromPrestaIndexes.pmsZusatzinformationen]),
            kontaktpersons: parseKontaktPersons(cells),
        };
    });

    const erhebungsmonat = lines[0] ? lines[0][importPmFromPrestaIndexes.erhebungsmonat] : '';
    return { preismeldestellen, erhebungsmonat };
}

export function preparePm(
    lines: string[][]
): { erhebungsmonat: string; preismeldungen: P.Models.PreismeldungReference[] } {
    const preismeldungen = lines.map(
        cells =>
            ({
                _id: P.preismeldungRefId(
                    cells[importPmFromPrestaIndexes.pmsNummer],
                    cells[importPmFromPrestaIndexes.epNummer],
                    cells[importPmFromPrestaIndexes.laufnummer]
                ),
                _rev: undefined,
                pmId: P.preismeldungId(
                    cells[importPmFromPrestaIndexes.pmsNummer],
                    cells[importPmFromPrestaIndexes.epNummer],
                    cells[importPmFromPrestaIndexes.laufnummer]
                ),
                preissubsystem: parseNumber(cells[importPmFromPrestaIndexes.preissubsystem], 'preissubsystem'),
                schemanummer: parseNumber(cells[importPmFromPrestaIndexes.schemanummer], 'schemanummer'),
                pmsNummer: cells[importPmFromPrestaIndexes.pmsNummer],
                epNummer: cells[importPmFromPrestaIndexes.epNummer],
                laufnummer: cells[importPmFromPrestaIndexes.laufnummer],
                preis: parseFloat(cells[importPmFromPrestaIndexes.preisT]),
                menge: parseFloat(cells[importPmFromPrestaIndexes.mengeT]),
                aktion: cells[importPmFromPrestaIndexes.aktionsCode] === '1',
                artikeltext: cells[importPmFromPrestaIndexes.text],
                artikelnummer: cells[importPmFromPrestaIndexes.artikelNummer],
                preisGueltigSeitDatum: cells[importPmFromPrestaIndexes.preisGueltigSeitDatum],
                basisPreis: parseFloat(cells[importPmFromPrestaIndexes.basispreis]),
                basisMenge: parseFloat(cells[importPmFromPrestaIndexes.basismenge]),
                fehlendePreiseR: cells[importPmFromPrestaIndexes.fehlendePreisR],
                notiz: cells[importPmFromPrestaIndexes.notiz],
                bemerkungen: cells[importPmFromPrestaIndexes.bemerkungen],
                internetLink: cells[importPmFromPrestaIndexes.internetLink],
                erhebungsZeitpunkt: <P.Models.Erhebungszeitpunkt>parseInt(
                    cells[importPmFromPrestaIndexes.erhebungsZeitpunkt],
                    10
                ),
                erhebungsAnfangsDatum: cells[importPmFromPrestaIndexes.erhebungsAnfangsDatum],
                erhebungsEndDatum: cells[importPmFromPrestaIndexes.erhebungsEndDatum],
                sortierungsnummer: parseInt(cells[importPmFromPrestaIndexes.sortierungsnummer], 10),
                preisVorReduktion: parseFloat(cells[importPmFromPrestaIndexes.preisVorReduktion]),
                mengeVorReduktion: parseFloat(cells[importPmFromPrestaIndexes.mengeVorReduktion]),
                datumVorReduktion: cells[importPmFromPrestaIndexes.datumVorReduktion],
                productMerkmale: parseProduktMerkmale(cells[importPmFromPrestaIndexes.produktMerkmale]),
            } as P.Models.PreismeldungReference)
    );

    const erhebungsmonat = lines[0] ? lines[0][importPmFromPrestaIndexes.erhebungsmonat] : '';
    return { preismeldungen, erhebungsmonat };
}

export function preparePmForExport(
    preismeldungen: (P.Models.Preismeldung & { pmRef: P.Models.PreismeldungReference })[],
    erhebungsmonat: string
) {
    let sortNumber = 1;
    return preismeldungen.map(pm =>
        validatePreismeldung(`${pm.pmsNummer}/${pm.epNummer}/${pm.laufnummer}`, () => ({
            Erhebungsmonat: erhebungsmonat,
            Preissubsystem: 2, // Preissubsystem is always 2 as defined by Serge
            Schemanummer: 0,
            Preiserhebungsort: toNumber(pm.pmsNummer, 8, 'Preiserhebungsort'),
            Erhebungspositionnummer: toNumber(pm.epNummer, 8, 'Erhebungspositionnummer'),
            Laufnummer: toNumber(pm.laufnummer, 10, 'Laufnummer'),
            Preis_T: toDecimal(pm.preis, 12, 4, 'Preis_T'),
            Menge_T: toDecimal(pm.menge, 10, 3, 'Menge_T'),
            Preis_VPK: toDecimal(pm.preisVPK, 12, 4, 'Preis_VPK'), // TODO: depending on actioncode #97
            Menge_VPK: toDecimal(pm.mengeVPK, 10, 3, 'Menge_VPK'),
            Bearbeitungscode: toNumber(pm.bearbeitungscode, 3, 'Bearbeitungscode'),
            Aktionscode: !pm.aktion ? 0 : 1,
            Preisbezeichnung: toText(pm.artikeltext, 200, 'Preisbezeichnung'),
            Artikelnummer: toText(pm.artikelnummer, 30, 'Artikelnummer'),
            Fehlende_Preise: toText(pm.fehlendePreiseR, 24, 'Fehlende_Preise'),
            PE_Notiz: toText(pm.notiz, 4000, 'PE_Notiz'),
            PE_Kommentar: toText(pm.kommentar, 4000, 'PE_Kommentar'),
            Bemerkungen: toText(pm.bemerkungen, 4000, 'Bemerkungen'),
            Internet_Link: toText(pm.internetLink.substr(0, 2000), 2000, 'Internet_Link'),
            Erhebungszeitpunkt: toNumber(pm.erhebungsZeitpunkt, 3, 'Erhebungszeitpunkt'),
            Sortiernummer: toNumber(sortNumber++, 5, 'Sortiernummer'),
            Preis_vor_Reduktion: toDecimal(pm.preisVorReduktion, 12, 4, 'Preis_vor_Reduktion'),
            Menge_vor_Reduktion: toDecimal(pm.mengeVorReduktion, 10, 3, 'Menge_vor_Reduktion'),
            Datum_vor_Reduktion: pm.datumVorReduktion,
            Produktmerkmale: toText(escapeProductMerkmale(pm.productMerkmale), 4000, 'Produktmerkmale'),
        }))
    );
}

export function preparePmsForExport(preismeldestellen: P.Models.Preismeldestelle[], erhebungsmonat: string) {
    return preismeldestellen.map(pms =>
        validatePreismeldestelle(pms.pmsNummer, () => ({
            Erhebungsmonat: erhebungsmonat,
            Preissubsystem: toNumber(pms.preissubsystem, 1, 'Preissubsystem'),
            PMS_Nummer: toNumber(pms.pmsNummer, 8, 'PMS_Nummer'),
            PMS_Name: toText(pms.name, 200, 'PMS_Name'),
            PMS_Zusatzname: toText(pms.supplement, 200, 'PMS_Zusatzname'),
            PMS_Strasse: toText(pms.street, 60, 'PMS_Strasse'),
            PMS_PLZ: toNumber(pms.postcode, 5, 'PMS_PLZ'),
            PMS_Ort: toText(pms.town, 40, 'PMS_Ort'),
            PMS_Telefon: toText(pms.telephone, 20, 'PMS_Telefon'),
            PMS_eMail: toText(pms.email, 50, 'PMS_eMail'),
            PMS_Sprache: !pms.languageCode ? null : LanguageMap[pms.languageCode],
            PMS_Erhebungsregion: toText(pms.erhebungsregion, 20, 'PMS_Erhebungsregion'),
            PMS_Erhebungsart: toText(pms.erhebungsart, 60, 'PMS_Erhebungsart'),
            PMS_Geschlossen: toNumber(pms.pmsGeschlossen, 1, 'PMS_Geschlossen'),
            Bemerkung_zur_Erhebungsart: toText(
                escapeNewlinesInText(pms.erhebungsartComment),
                1000,
                'Bemerkung_zur_Erhebungsart'
            ),
            PMS_Zusatzinformationen: toText(
                escapeNewlinesInText(pms.zusatzInformationen),
                1000,
                'PMS_Zusatzinformationen'
            ),
            KP1_OID: toNumber(pms.kontaktpersons[0].oid, 10, 'KP1_OID'),
            KP1_Vorname: toText(pms.kontaktpersons[0].firstName, 40, 'KP1_Vorname'),
            KP1_Name: toText(pms.kontaktpersons[0].surname, 40, 'KP1_Name'),
            KP1_Funktion: toText(pms.kontaktpersons[0].personFunction, 100, 'KP1_Funktion'),
            KP1_Telefon: toText(pms.kontaktpersons[0].telephone, 20, 'KP1_Telefon'),
            KP1_Mobile: toText(pms.kontaktpersons[0].mobile, 20, 'KP1_Mobile'),
            KP1_Fax: toText(pms.kontaktpersons[0].fax, 20, 'KP1_Fax'),
            KP1_eMail: toText(pms.kontaktpersons[0].email, 50, 'KP1_eMail'),
            KP1_Sprache: !pms.kontaktpersons[0].languageCode ? null : LanguageMap[pms.kontaktpersons[0].languageCode],
            KP2_OID: toNumber(pms.kontaktpersons[1].oid, 10, 'KP2_OID'),
            KP2_Vorname: toText(pms.kontaktpersons[1].firstName, 40, 'KP2_Vorname'),
            KP2_Name: toText(pms.kontaktpersons[1].surname, 40, 'KP2_Name'),
            KP2_Funktion: toText(pms.kontaktpersons[1].personFunction, 100, 'KP2_Funktion'),
            KP2_Telefon: toText(pms.kontaktpersons[1].telephone, 20, 'KP2_Telefon'),
            KP2_Mobile: toText(pms.kontaktpersons[1].mobile, 20, 'KP2_Mobile'),
            KP2_Fax: toText(pms.kontaktpersons[1].fax, 20, 'KP2_Fax'),
            KP2_eMail: toText(pms.kontaktpersons[1].email, 50, 'KP2_eMail'),
            KP2_Sprache: !pms.kontaktpersons[1].languageCode ? null : LanguageMap[pms.kontaktpersons[1].languageCode],
        }))
    );
}

export function preparePreiserheberForExport(
    preiserhebers: (P.Models.Erheber & { pmsNummers: string[] })[],
    erhebungsmonat: string,
    erhebungsorgannummer: number
) {
    return preiserhebers.map(preiserheber =>
        validatePreiserheber(preiserheber.username, () => ({
            Erhebungsmonat: erhebungsmonat,
            Preissubsystem: 2, // Fix 2 defined by Serge "Das Preissubsystem ist effektiv Konstant auf 2"
            Erhebungsorgannummer: toNumber(erhebungsorgannummer, 2, 'Erhebungsorgannummer'),
            PE_Nummer: toNumber(preiserheber.peNummer, 10, 'PE_Nummer'),
            PE_Vorname: toText(preiserheber.firstName, 40, 'PE_Vorname'),
            PE_Name: toText(preiserheber.surname, 40, 'PE_Name'),
            PE_Erhebungsregion: toText(preiserheber.erhebungsregion, 100, 'PE_Erhebungsregion'),
            PE_Telefon: toText(preiserheber.telephone, 20, 'PE_Telefon'),
            PE_Mobile: toText(preiserheber.mobilephone, 20, 'PE_Mobile'),
            PE_Fax: toText(preiserheber.fax, 20, 'PE_Fax'),
            PE_eMail: toText(preiserheber.email, 50, 'PE_eMail'),
            PE_Webseite: toText(preiserheber.webseite, 400, 'PE_Webseite'),
            PE_Sprache: !preiserheber.languageCode ? null : LanguageMap[preiserheber.languageCode],
            PE_Strasse: toText(preiserheber.street, 60, 'PE_Strasse'),
            PE_PLZ: toNumber(preiserheber.postcode, 5, 'PE_PLZ'),
            PE_Ort: toText(preiserheber.town, 40, 'PE_Ort'),
            PE_Zuweisung_PMS: toText(preiserheber.pmsNummers.join(','), 400, 'PE_Zuweisung_PMS'),
        }))
    );
}

function toNumber(value: any, maxLength: number, propertyName: string) {
    // The simple comparison is being used to compare against undefined too.
    if (value == null) return null;
    const result = parseInt(value, 10);
    if (isNaN(result)) return null;

    const resultLength = !!result ? result.toString().length : 0;
    if (resultLength > maxLength)
        throw new Error(`Der Wert für "${propertyName}" ist zu lang. [${resultLength}/${maxLength}]`);
    return result;
}

function toDecimal(value: any, maxLength: number, maxDigits: number, propertyName: string) {
    // The simple comparison is being used to compare against undefined too.
    if (value == null) return null;
    const result = parseInt(value, 10);
    if (isNaN(result)) return null;

    const resultLength = !!result ? result.toString().length : 0;
    if (resultLength > maxLength)
        throw new Error(`Der Wert für "${propertyName}" ist zu lang. [${resultLength}/${maxLength}]`);
    return parseFloat(value).toFixed(maxDigits);
}

function toText(value: string, maxLength: number, propertyName: string) {
    const resultLength = !!value ? value.toString().length : 0;
    if (resultLength > maxLength)
        throw new Error(`Der Wert für "${propertyName}" ist zu lang. [${resultLength}/${maxLength}]`);
    return value;
}

function parseNumber(s: string, propertyName: string) {
    const number = parseInt(s, 10);
    if (isNaN(number)) throw new Error(`Invalid ${propertyName}: '${s}'`);
    return number;
}

function parseNewlinesInText(s: string) {
    if (s == null) return s;
    const x = s.replace(/ \\n /g, '\n');
    return x;
}

function escapeNewlinesInText(s: string) {
    if (s == null) return s;
    return s.replace(/\n/g, ' \\n ');
}

function escapeProductMerkmale(merkmale: string[]) {
    if (!merkmale || merkmale.length === 0) return ';'; // At least 1 semicolon is required for the PRESTA system
    const combined = toCsv([keyBy(merkmale)], false);
    return toCsv([{ merkmale: combined }], false).replace(/(^"|"$)/g, '');
}

function parsePmsGeschlossen(s: string) {
    const _s = s.trim();
    if (!_s) return 0;
    return parseNumber(_s, 'PMS_Geschlossen');
}

function parseLanguageCode(s: string) {
    if (!s) return null;
    if (!LanguageMap[s]) throw new Error(`Unbekannte Sprache konnte nicht interpretiert werden: "${s}"`);
    return LanguageMap[s];
}

function validatePreiserheber(id: string, mapper: Function) {
    const requiredFields = [
        'Erhebungsmonat',
        'Preissubsystem',
        'Erhebungsorgannummer',
        'PE_Nummer',
        'PE_Vorname',
        'PE_Name',
        'PE_Sprache',
    ];

    return _validate(id, mapper, requiredFields, `Fehler beim export von dem Preiserheber "${id}"`);
}

function validatePreismeldestelle(id: string, mapper: Function) {
    const requiredFields = [
        'Erhebungsmonat',
        'Preissubsystem',
        'PMS_Nummer',
        'PMS_Name',
        'PMS_Sprache',
        'PMS_Erhebungsregion',
        'PMS_Erhebungsart',
    ];

    return _validate(id, mapper, requiredFields, `Fehler beim export von der PMS "${id}"`);
}

function validatePreismeldung(id: string, mapper: Function) {
    const requiredFields = [
        'Erhebungsmonat',
        'Preissubsystem',
        'Schemanummer',
        'Preiserhebungsort',
        'Erhebungspositionnummer',
        'Laufnummer',
        'Preis_T',
        'Menge_T',
        'Sortiernummer',
        'Produktmerkmale',
    ];

    return _validate(id, mapper, requiredFields, `Fehler beim export von der PM "${id}"`);
}

function _validate(id: string, mapper: Function, requiredFields: string[], errorMessage: string) {
    try {
        const entity = mapper();

        // Simple comparison is being used to be able to compare towards undefined too
        const missingFields = requiredFields.filter(f => entity[f] == null || entity[f] === '');
        if (missingFields.length > 0)
            throw new Error(`Folgende Werte sind nicht gesetzt:\n${missingFields.join(', ')}`);
        return entity;
    } catch (error) {
        throw new Error(`${errorMessage}: ${error.message}`);
    }
}
