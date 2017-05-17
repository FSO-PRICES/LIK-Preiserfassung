import * as _ from 'lodash';
import * as docuri from 'docuri';
import { Models as P } from 'lik-shared';

const preismeldungRefUri = docuri.route(P.preismeldungReferenceUriRoute);
const preismeldungUri = docuri.route(P.preismeldungUriRoute);
const preismeldestelleUri = docuri.route(P.pmsUriRoute);

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
    pmsErhebungshäufigkeit: 13,
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
    return merkmale.slice(0, lastValueIndex + 1).map(x => x === '' ? null : x);
}

function parseKontaktPersons(cells: string[]) {
    return <P.KontaktPerson[]>[
        {
            oid: cells[importPmsFromPrestaIndexes.kp1Oid],
            firstName: cells[importPmsFromPrestaIndexes.kp1Vorname],
            surname: cells[importPmsFromPrestaIndexes.kp1Name],
            personFunction: cells[importPmsFromPrestaIndexes.kp1Funktion],
            telephone: cells[importPmsFromPrestaIndexes.kp1Telefon],
            mobile: cells[importPmsFromPrestaIndexes.kp1Mobile],
            fax: cells[importPmsFromPrestaIndexes.kp1Fax],
            email: cells[importPmsFromPrestaIndexes.kp1EMail],
            languageCode: cells[importPmsFromPrestaIndexes.kp1Sprache]
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
            languageCode: cells[importPmsFromPrestaIndexes.kp2Sprache]
        },
    ]
}


export function preparePms(lines: string[][]) {
    const preismeldestellen = lines.map(cells => {
        const id = preismeldestelleUri({ pmsNummer: cells[importPmsFromPrestaIndexes.pmsNummer] });
        return <P.AdvancedPreismeldestelle>{
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
            languageCode: cells[importPmsFromPrestaIndexes.pmsSprache],
            erhebungsart: cells[importPmsFromPrestaIndexes.pmsErhebungsart],
            erhebungsartComment: cells[importPmsFromPrestaIndexes.bemerkungZurErhebungsart],
            erhebungshaeufigkeit: cells[importPmsFromPrestaIndexes.pmsErhebungshäufigkeit],
            erhebungsregion: cells[importPmsFromPrestaIndexes.pmsErhebungsregion],
            zusatzInformationen: cells[importPmsFromPrestaIndexes.pmsZusatzinformationen],
            kontaktpersons: parseKontaktPersons(cells),
            active: true
        };
    });

    const erhebungsmonat = lines[0] ? lines[0][importPmFromPrestaIndexes.erhebungsmonat] : '';
    return { preismeldestellen, erhebungsmonat };
}

export function preparePm(lines: string[][]): { erhebungsmonat: string, preismeldungen: P.PreismeldungReference[]} {
    const preismeldungen = lines
        .map(cells => ({
            _id: preismeldungRefUri({ pmsNummer: cells[importPmFromPrestaIndexes.pmsNummer], epNummer: cells[importPmFromPrestaIndexes.epNummer], laufnummer: cells[importPmFromPrestaIndexes.laufnummer] }),
            _rev: undefined,
            pmId: preismeldungUri({ pmsNummer: cells[importPmFromPrestaIndexes.pmsNummer], epNummer: cells[importPmFromPrestaIndexes.epNummer], laufnummer: cells[importPmFromPrestaIndexes.laufnummer] }),
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
            erhebungsZeitpunkt: <P.Erhebungszeitpunkt>parseInt(cells[importPmFromPrestaIndexes.erhebungsZeitpunkt], 10),
            erhebungsAnfangsDatum: cells[importPmFromPrestaIndexes.erhebungsAnfangsDatum],
            erhebungsEndDatum: cells[importPmFromPrestaIndexes.erhebungsEndDatum],
            sortierungsnummer: parseInt(cells[importPmFromPrestaIndexes.sortierungsnummer], 10),
            preisVorReduktion: parseFloat(cells[importPmFromPrestaIndexes.preisVorReduktion]),
            mengeVorReduktion: parseFloat(cells[importPmFromPrestaIndexes.mengeVorReduktion]),
            datumVorReduktion: cells[importPmFromPrestaIndexes.datumVorReduktion],
            productMerkmale: parseProduktMerkmale(cells[importPmFromPrestaIndexes.produktMerkmale])
        } as P.PreismeldungReference));

    const erhebungsmonat = lines[0] ? lines[0][importPmFromPrestaIndexes.erhebungsmonat] : '';
    return { preismeldungen, erhebungsmonat };
}

export function preparePmForExport(preismeldungen: (P.PreismeldungProperties & P.PreismeldungReferenceProperties & P.PmsPreismeldungenSortProperties)[]) {
    return preismeldungen.map(pm => ({
        'Erhebungsmonat': null, // TODO 1. Tag des Erhebungsmonats
        'Preissubsystem': null, // LIK = 2
        'Schemanummer': 0, // TODO: Always 0?
        'Preiserhebungsort': pm.pmsNummer,
        'Erhebungspositionnummer': pm.epNummer,
        'Laufnummer': pm.laufnummer,
        'Preis_T': pm.preis,
        'Menge_T': pm.menge,
        'Preis_VPK': null, // TODO: ref_pm preis
        'Menge_VPK': null, // TODO: ref_pm menge
        'Bearbeitungscode': pm.bearbeitungscode,
        'Aktionscode': pm.aktion,
        'Preisbezeichnung': null, // TODO: Find out how to get this
        'Artikelnummer': pm.artikelnummer,
        'Fehlende_Preise': pm.fehlendePreiseR,
        'PE_Notiz': pm.notiz,
        'PE_Kommentar': pm.kommentar,
        'Bemerkungen': pm.bemerkungen,
        'Internet_Link': pm.internetLink,
        'Erhebungszeitpunkt': pm.erhebungsZeitpunkt,
        'Sortiernummer': pm.sortOrder,
        'Preis_vor_Reduktion': pm.preisVorReduktion,
        'Menge_vor_Reduktion': pm.mengeVorReduktion,
        'Datum_vor_Reduktion': null, // TODO: Find out how to get this
        'Produktmerkmale': null // TODO how to get? By ref_pm?
    }));
}

export function preparePmsForExport(preismeldestellen: P.AdvancedPreismeldestelle[], erhebungsmonat) {
    return preismeldestellen.map(pms => ({
        'Erhebungsmonat': erhebungsmonat,
        'Preissubsystem': pms.preissubsystem,
        'PMS_Nummer': pms.pmsNummer,
        'PMS_Name': pms.name,
        'PMS_Zusatzname': pms.supplement,
        'PMS_Strasse': pms.street,
        'PMS_PLZ': pms.postcode,
        'PMS_Ort': pms.town,
        'PMS_Telefon': pms.telephone,
        'PMS_eMail': pms.email,
        'PMS_Sprache': pms.languageCode,
        'PMS_Erhebungsregion': pms.erhebungsregion,
        'PMS_Erhebungsart': pms.erhebungsart,
        'PMS_Erhebungshäufigkeit': pms.erhebungshaeufigkeit,
        'Bemerkung_zur_Erhebungsart': pms.erhebungsartComment,
        'PMS_Zusatzinformationen': pms.zusatzInformationen,
        'KP1_OID': pms.kontaktpersons[0].oid,
        'KP1_Vorname': pms.kontaktpersons[0].firstName,
        'KP1_Name': pms.kontaktpersons[0].surname,
        'KP1_Funktion': pms.kontaktpersons[0].personFunction,
        'KP1_Telefon': pms.kontaktpersons[0].telephone,
        'KP1_Mobile': pms.kontaktpersons[0].mobile,
        'KP1_Fax': pms.kontaktpersons[0].fax,
        'KP1_eMail': pms.kontaktpersons[0].email,
        'KP1_Sprache': pms.kontaktpersons[0].languageCode,
        'KP2_OID': pms.kontaktpersons[1].oid,
        'KP2_Vorname': pms.kontaktpersons[1].firstName,
        'KP2_Name': pms.kontaktpersons[1].surname,
        'KP2_Funktion': pms.kontaktpersons[1].personFunction,
        'KP2_Telefon': pms.kontaktpersons[1].telephone,
        'KP2_Mobile': pms.kontaktpersons[1].mobile,
        'KP2_Fax': pms.kontaktpersons[1].fax,
        'KP2_eMail': pms.kontaktpersons[1].email,
        'KP2_Sprache': pms.kontaktpersons[1].languageCode,
    }));
}

export function preparePreiserheberForExport(preiserhebers: { preiserheber: P.Erheber, pmsNummers: string[] }[], data: { erhebungsmonat: Date, erhebungsorgannummer: number } = null) {
    return preiserhebers.map(({ preiserheber, pmsNummers }) => ({
        'Erhebungsmonat': data != null ? data.erhebungsmonat.toString() : null,
        'Preissubsystem': preiserheber.preissubsystem,
        'Erhebungsorgannummer': data != null ? data.erhebungsorgannummer : null,
        'PE_Nummer': null, // TODO: Check if needed, because we don't parse an import file
        'PE_Vorname': preiserheber.firstName,
        'PE_Name': preiserheber.surname,
        'PE_Funktion': preiserheber.personFunction,
        'PE_Telefon': preiserheber.telephone,
        'PE_Mobile': preiserheber.mobilephone,
        'PE_Fax': preiserheber.fax,
        'PE_eMail': preiserheber.email,
        'PE_Webseite': preiserheber.webseite,
        'PE_Sprache': preiserheber.languageCode,
        'PE_Strasse': preiserheber.street,
        'PE_PLZ': preiserheber.postcode,
        'PE_Ort': preiserheber.town,
        'PE_Zuweisung_PMS': pmsNummers.join(','),
    }));
}

function parseNumber(s: string, propertyName: string) {
    const number = parseInt(s, 10);
    if (isNaN(number)) throw new Error(`Invalid ${propertyName}: '${s}'`);
    return number;
}
