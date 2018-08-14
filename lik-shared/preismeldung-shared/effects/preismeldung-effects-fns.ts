/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { cloneDeep } from 'lodash';
import { format, startOfMonth } from 'date-fns';
import * as P from '../models';

export function createVorReduktionProperties(
    bag: P.PreismeldungBag
): { preisVorReduktion: string; mengeVorReduktion: string; datumVorReduktion: string } {
    const today = format(new Date(), 'DD.MM.YYYY');
    const firstDayOfMonth = format(startOfMonth(new Date()), 'DD.MM.YYYY');

    const preisMengeDatumVorReduktionVP = () => ({
        preisVorReduktion: `${bag.refPreismeldung.preisVorReduktion}`,
        mengeVorReduktion: `${bag.refPreismeldung.mengeVorReduktion}`,
        datumVorReduktion: `${bag.refPreismeldung.datumVorReduktion}`,
    });

    const rsZero: P.Models.Bearbeitungscode[] = [101, 44, 0]; // 'R', 'S', '0'
    if (rsZero.some(x => x === bag.preismeldung.bearbeitungscode)) {
        return preisMengeDatumVorReduktionVP();
    } else {
        if (!bag.preismeldung.aktion) {
            return {
                preisVorReduktion: bag.preismeldung.preis,
                mengeVorReduktion: bag.preismeldung.menge,
                datumVorReduktion: today,
            };
        } else {
            switch (bag.preismeldung.bearbeitungscode) {
                case 99:
                    return preisMengeDatumVorReduktionVP();
                case 2:
                case 7:
                    return {
                        preisVorReduktion: bag.preismeldung.preisVPK,
                        mengeVorReduktion: bag.preismeldung.mengeVPK,
                        datumVorReduktion: firstDayOfMonth,
                    };
                case 1:
                    return {
                        preisVorReduktion: bag.preismeldung.preisVorReduktion,
                        mengeVorReduktion: bag.preismeldung.mengeVorReduktion,
                        datumVorReduktion: today,
                    };
            }
        }
    }

    throw new Error(
        `Error in createVorReduktionProperties. Action: ${bag.preismeldung.aktion}, Bearbeitungscode: ${
            bag.preismeldung.bearbeitungscode
        }`
    );
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
        erfasstAt: bag.preismeldung.erfasstAt,
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
        datumVorReduktion: bag.preismeldung.datumVorReduktion,
    };
}

export function messagesFromCurrentPreismeldung(bag: P.CurrentPreismeldungBag) {
    return {
        notiz: bag.messages.notiz,
        kommentar:
            bag.messages.kommentarAutotext.join(',') +
            (bag.messages.kommentarAutotext.length > 0 ? '¶' : '') +
            bag.messages.kommentar,
        bemerkungen: bag.messages.bemerkungen,
        modifiedAt: format(new Date()),
    };
}

export function productMerkmaleFromCurrentPreismeldung(bag: P.CurrentPreismeldungBag) {
    return {
        productMerkmale: cloneDeep(bag.attributes),
        modifiedAt: format(new Date()),
    };
}
