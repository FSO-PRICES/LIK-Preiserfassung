import * as _ from 'lodash';
import * as docuri from 'docuri';
import { Models as P } from 'lik-shared';
import { AdvancedPreismeldestelle, KontaktPerson } from '../../../../lik-shared/common/models';

const preismeldungRefUri = docuri.route(P.preismeldungReferenceUriRoute);
const preismeldungUri = docuri.route(P.preismeldungUriRoute);
const preismeldestelleUri = docuri.route(P.pmsUriRoute);

const importPmsFromPrestaIndexes = {
    pmsNummer: 0, // PARTNER_NB
    name: 1, // PARTNER_NAME_TX
    supplement: 2,
    street: 3,
    postcode: 4,
    town: 5,
    telephone: 6, // PARTNER_TEL_NB_TX
    email: 7, // PARTNER_E_MAIL_TX
    languageCode: 8, // PARTNER_LANGUAGE_CD
    firstNameK1: 9, // FIRST_NAME_TX
    surnameK1: 10,
    personFunctionK1: 11,
    languageCodeK1: 12, // PERSON_LANGUAGE_CD
    telephoneK1: 13,
    emailK1: 14,
    // TODO: Add kontaktperson 2
};

const importPmFromPrestaIndexes = {
    erhebungsMonat: 0,
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
    bemerkungen: 15,
    internetLink: 16,
    erhebungsZeitpunkt: 17,
    erhebungsAnfangsDatum: 18,
    erhebungsEndDatum: 19,
    sortierungsnummer: 20,
    preisVorReduktion: 21,
    mengeVorReduktion: 22,
    datumVorReduktion: 23,
    produktMerkmale: 24,
};

function parseProduktMerkmale(content: string) {
    return content.split(';');
}

function parseKontaktPersons(cells: string[]) {
    return <KontaktPerson[]>[
        {
            firstName: cells[importPmsFromPrestaIndexes.firstNameK1],
            surname: cells[importPmsFromPrestaIndexes.surnameK1],
            personFunction: cells[importPmsFromPrestaIndexes.personFunctionK1],
            languageCode: cells[importPmsFromPrestaIndexes.languageCodeK1],
            telephone: cells[importPmsFromPrestaIndexes.telephoneK1],
            mobile: null,
            fax: null,
            email: cells[importPmsFromPrestaIndexes.emailK1]
        },
        {
            // TODO: Add kontaktperson 2
            firstName: null, //cells[importPmsFromPrestaIndexes.firstNameK2],
            surname: null, //cells[importPmsFromPrestaIndexes.surnameK2],
            personFunction: null, //cells[importPmsFromPrestaIndexes.personFunctionK2],
            languageCode: null, //cells[importPmsFromPrestaIndexes.languageCodeK2],
            telephone: null, //cells[importPmsFromPrestaIndexes.telephoneK2],
            mobile: null,
            fax: null,
            email: null, //cells[importPmsFromPrestaIndexes.emailK2]
        },
    ]
}


export function preparePms(lines: string[][]) {
    return lines.map(cells => {
        const id = preismeldestelleUri({ pmsNummer: cells[importPmsFromPrestaIndexes.pmsNummer] });
        return <P.AdvancedPreismeldestelle>{
            _id: id,
            pmsNummer: cells[importPmsFromPrestaIndexes.pmsNummer],
            name: cells[importPmsFromPrestaIndexes.name],
            supplement: cells[importPmsFromPrestaIndexes.supplement],
            street: cells[importPmsFromPrestaIndexes.street],
            postcode: cells[importPmsFromPrestaIndexes.postcode],
            town: cells[importPmsFromPrestaIndexes.town],
            telephone: cells[importPmsFromPrestaIndexes.telephone],
            email: cells[importPmsFromPrestaIndexes.email],
            languageCode: cells[importPmsFromPrestaIndexes.languageCode],
            kontaktpersons: parseKontaktPersons(cells),
            active: true
        };
    });
}

export function preparePm(lines: string[][]) {
    return lines.map(cells => {
        return <P.PreismeldungReferenceProperties>{
            _id: preismeldungRefUri({ pmsNummer: cells[importPmFromPrestaIndexes.pmsNummer], epNummer: cells[importPmFromPrestaIndexes.epNummer], laufnummer: cells[importPmFromPrestaIndexes.laufnummer] }),
            pmId: preismeldungUri({ pmsNummer: cells[importPmFromPrestaIndexes.pmsNummer], epNummer: cells[importPmFromPrestaIndexes.epNummer], laufnummer: cells[importPmFromPrestaIndexes.laufnummer] }),
            pmsNummer: cells[importPmFromPrestaIndexes.pmsNummer],
            epNummer: cells[importPmFromPrestaIndexes.epNummer],
            laufnummer: cells[importPmFromPrestaIndexes.laufnummer],
            basisPreis: parseFloat(cells[importPmFromPrestaIndexes.basispreis]),
            basisMenge: parseFloat(cells[importPmFromPrestaIndexes.basismenge]),
            internetLink: cells[importPmFromPrestaIndexes.internetLink],
            preis: parseFloat(cells[importPmFromPrestaIndexes.preisT]),
            menge: parseFloat(cells[importPmFromPrestaIndexes.mengeT]),
            aktion: cells[importPmFromPrestaIndexes.aktionsCode] === '1',
            preisGueltigSeitDatum: cells[importPmFromPrestaIndexes.preisGueltigSeitDatum],
            preisVorReduktion: parseFloat(cells[importPmFromPrestaIndexes.preisVorReduktion]),
            mengeVorReduktion: parseFloat(cells[importPmFromPrestaIndexes.mengeVorReduktion]),
            fehlendePreiseR: cells[importPmFromPrestaIndexes.fehlendePreisR],
            // istPreisreiheZuBeenden: cells[importFromPrestaIndexes.istPreisreiheZuBeenden] === '1',
            zeitbereichPos: parseInt(cells[importPmFromPrestaIndexes.erhebungsZeitpunkt], 10),
            sortierungsnummer: parseInt(cells[importPmFromPrestaIndexes.sortierungsnummer], 10),
            erhebungsZeitpunkt: cells[importPmFromPrestaIndexes.erhebungsZeitpunkt],
            erhebungsAnfangsDatum: cells[importPmFromPrestaIndexes.erhebungsAnfangsDatum],
            erhebungsEndDatum: cells[importPmFromPrestaIndexes.erhebungsEndDatum],
            productMerkmale: parseProduktMerkmale(cells[importPmFromPrestaIndexes.produktMerkmale]),
            artikelnummer: cells[importPmFromPrestaIndexes.artikelNummer],
            artikeltext: cells[importPmFromPrestaIndexes.text],
            bermerkungenVomBfs: cells[importPmFromPrestaIndexes.bemerkungen]
        };
    });
}
