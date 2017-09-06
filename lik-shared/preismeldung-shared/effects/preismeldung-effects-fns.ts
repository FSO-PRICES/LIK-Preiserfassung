import { cloneDeep } from 'lodash';
import { format, startOfMonth } from 'date-fns';
import * as P from '../models';

export function createVorReduktionProperties(bag: P.PreismeldungBag): { preisVorReduktion: string; mengeVorReduktion: string; datumVorReduktion: string } {
    let preisVorReduktion, mengeVorReduktion, datumVorReduktion;
    const today = format(new Date(), 'DD.MM.YYYY');
    const firstDayOfMonth = format(startOfMonth(new Date()), 'DD.MM.YYYY');

    if (!bag.preismeldung.aktion) {
        preisVorReduktion = bag.preismeldung.preis;
        mengeVorReduktion = bag.preismeldung.menge;
        datumVorReduktion = today;
    } else {
        switch (bag.preismeldung.bearbeitungscode) {
            case 99: {
                preisVorReduktion = `${bag.refPreismeldung.preisVorReduktion}`
                mengeVorReduktion = `${bag.refPreismeldung.mengeVorReduktion}`;
                datumVorReduktion = `${bag.refPreismeldung.datumVorReduktion}`;
                break;
            }
            case 2:
            case 7: {
                preisVorReduktion = bag.preismeldung.preisVPK;
                mengeVorReduktion = bag.preismeldung.mengeVPK;
                datumVorReduktion = firstDayOfMonth;
                break;
            }
            case 1: {
                preisVorReduktion = bag.preismeldung.preisVorReduktion;
                mengeVorReduktion = bag.preismeldung.mengeVorReduktion;
                datumVorReduktion = today;
                break;
            }
        }
    }

    return {
        preisVorReduktion,
        mengeVorReduktion,
        datumVorReduktion
    };
}

export function propertiesFromCurrentPreismeldung(bag: P.CurrentPreismeldungBag) {
    return {
        aktion: bag.preismeldung.aktion,
        artikelnummer: bag.preismeldung.artikelnummer,
        artikeltext: bag.preismeldung.artikeltext,
        bearbeitungscode: bag.preismeldung.bearbeitungscode,
        erhebungsZeitpunkt: bag.preismeldung.erhebungsZeitpunkt,
        internetLink: bag.preismeldung.internetLink,
        istAbgebucht: true,
        menge: bag.preismeldung.menge,
        mengeVPK: bag.preismeldung.mengeVPK,
        mengeVorReduktion: bag.preismeldung.mengeVorReduktion,
        modifiedAt: format(new Date()),
        d_DPToVP: bag.preismeldung.d_DPToVP,
        d_DPToVPVorReduktion: bag.preismeldung.d_DPToVPVorReduktion,
        d_DPToVPK: bag.preismeldung.d_DPToVPK,
        d_VPKToVPAlterArtikel: bag.preismeldung.d_VPKToVPAlterArtikel,
        d_VPKToVPVorReduktion: bag.preismeldung.d_VPKToVPVorReduktion,
        d_DPVorReduktionToVPVorReduktion: bag.preismeldung.d_DPVorReduktionToVPVorReduktion,
        d_DPVorReduktionToVP: bag.preismeldung.d_DPVorReduktionToVP,
        preis: bag.preismeldung.preis,
        preisVPK: bag.preismeldung.preisVPK,
        preisVorReduktion: bag.preismeldung.preisVorReduktion,
        fehlendePreiseR: bag.preismeldung.fehlendePreiseR,
        datumVorReduktion: bag.preismeldung.datumVorReduktion
    };
}

export function messagesFromCurrentPreismeldung(bag: P.CurrentPreismeldungBag) {
    return {
        notiz: bag.messages.notiz,
        kommentar: bag.messages.kommentarAutotext.join(',') + (bag.messages.kommentarAutotext.length > 0 ? '\\n' : '') + bag.messages.kommentar,
        bemerkungen: bag.messages.bemerkungenHistory + (!!bag.messages.bemerkungenHistory ? '\\n' : '') + (!!bag.messages.bemerkungen ? (!bag.messages.isAdminApp ? 'PE:' : 'BFS:') + bag.messages.bemerkungen : ''),
        modifiedAt: format(new Date()),
    };
}

export function productMerkmaleFromCurrentPreismeldung(bag: P.CurrentPreismeldungBag) {
    return {
        productMerkmale: cloneDeep(bag.attributes),
        modifiedAt: format(new Date())
    };
}
