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

import * as Models from '../../common/models';
import { CurrentPreismeldungBag, PreismeldungPricePayload } from '../../preismeldung-shared/models';

import { warenkorbLeaf } from './warenkorb';
import { preismeldungRefId, preismeldungId } from '../../common/helper-functions';
import { CurrentPreismeldungBagMessages } from '../../preismeldung-shared/reducers/preismeldung.reducer';

export type PreismeldungOverrides = {
    preismeldung?: Partial<Models.Preismeldung>;
    refPreismeldung?: Partial<Models.PreismeldungReference>;
    warenkorbPosition?: Partial<Models.WarenkorbLeaf>;
    messages?: Partial<CurrentPreismeldungBagMessages>;
};

// export type DeepPartial<T> = { [P in keyof T]?: Partial<T[P]> };

// export const preismeldungBag = (overrides: PreismeldungOverrides = { pm: {}, refPm: {}, wp: {} }) => {
//     const pm = preismeldung(overrides.pm);
//     return {
//         pmId: pm._id,
//         preismeldung: pm,
//         refPreismeldung: preismeldungReference(overrides.refPm, overrides.pm),
//         sortierungsnummer: null,
//         warenkorbPosition: warenkorbLeaf(overrides.wp),
//         exported: false,
//     };
// };

export const currentPreismeldung = (override: PreismeldungOverrides = {}) => {
    const pm = preismeldung(override.preismeldung || {});
    return {
        attributes: pm.productMerkmale,
        exported: false,
        hasAttributeWarning: false,
        hasMessageNotiz: false,
        hasMessageToCheck: false,
        hasPriceWarning: false,
        isAttributesModified: false,
        isMessagesModified: false,
        isModified: false,
        isNew: false,
        lastSaveAction: null,
        messages: {
            ...{ bemerkungen: '', isAdminApp: false, kommentar: '', kommentarAutotext: [], notiz: '' },
            ...override.messages,
        },
        originalBearbeitungscode: 1 as Models.Bearbeitungscode,
        pmId: pm._id,
        sortierungsnummer: null,
        textzeile: [],
        priceCountStatus: { numActivePrices: 1, anzahlPreiseProPMS: 1, ok: true, enough: true },
        resetEvent: 1234,
        ...{
            preismeldung: pm,
            refPreismeldung: preismeldungReference(override.refPreismeldung, override.preismeldung),
            warenkorbPosition: warenkorbLeaf(override.warenkorbPosition),
        },
    };
};

export const preismeldung = (override: Partial<Models.Preismeldung> = {}): Models.Preismeldung => {
    const pmsNummer = override.pmsNummer || '12453';
    const epNummer = override.epNummer || '3024';
    const laufnummer = override.laufnummer || '3';
    return {
        ...{
            _id: preismeldungId(pmsNummer, epNummer, laufnummer),
            _rev: '10-0b4c1s4cad',
            aktion: false,
            artikelnummer: '',
            artikeltext: 'asgasg asg asg asgasg ',
            bearbeitungscode: 1 as Models.Bearbeitungscode,
            bemerkungen: '',
            d_DPToVP: { limitType: null, percentage: -33.3889816360601, textzeil: null, warning: false },
            d_DPToVPK: { limitType: null, percentage: null, textzeil: null, warning: false },
            d_DPToVPVorReduktion: {
                limitType: null,
                percentage: -33.3889816360601,
                textzeil: null,
                warning: false,
            },
            d_DPVorReduktionToVP: { limitType: null, percentage: null, textzeil: null, warning: false },
            d_DPVorReduktionToVPVorReduktion: {
                limitType: null,
                percentage: null,
                textzeil: null,
                warning: false,
            },
            d_VPKToVPAlterArtikel: { limitType: null, percentage: null, textzeil: null, warning: false },
            d_VPKToVPVorReduktion: { limitType: null, percentage: null, textzeil: null, warning: false },
            datumVorReduktion: '10.04.2018',
            epNummer,
            erfasstAt: 1523353334579,
            erhebungsZeitpunkt: null,
            fehlendePreiseR: '',
            internetLink: '',
            istAbgebucht: true,
            kommentar: '',
            laufnummer,
            menge: '1',
            mengeVPK: null,
            mengeVorReduktion: '1',
            modifiedAt: '2018-04-10T11:42:14.592+02:00',
            notiz: '',
            pmsNummer,
            preis: '39.90',
            preisVPK: null,
            preisVorReduktion: '39.90',
            productMerkmale: ['a s e ', '22 asdg', '25 asgw ', 'sgww ss'],
            uploadRequestedAt: '2018-08-06T09:04:40.082Z',
        },
        ...override,
    };
};

export const preismeldungReference = (
    override: Partial<Models.PreismeldungReference> = {},
    pm: { pmsNummer?: string; epNummer?: string; laufnummer?: string } = {} as any
): Models.PreismeldungReference => {
    const pmsNummer = pm.pmsNummer || override.pmsNummer || '12453';
    const epNummer = pm.epNummer || override.epNummer || '3024';
    const laufnummer = pm.laufnummer || override.laufnummer || '3';
    return {
        ...{
            _id: preismeldungRefId(pmsNummer, epNummer, laufnummer),
            _rev: '1-237ssb7f4',
            aktion: false,
            artikelnummer: '',
            artikeltext: 'ag asga sg asg',
            basisMenge: 1,
            basisPreis: 59.9,
            bemerkungen: '',
            datumVorReduktion: '',
            epNummer,
            erhebungsAnfangsDatum: '03.04.2018',
            erhebungsEndDatum: '12.04.2018',
            erhebungsZeitpunkt: null,
            fehlendePreiseR: null,
            internetLink: '',
            laufnummer,
            menge: 1,
            mengeVorReduktion: 1,
            notiz: '',
            pmId: preismeldungId(pmsNummer, epNummer, laufnummer),
            pmsNummer,
            preis: 59.9,
            preisGueltigSeitDatum: '01.04.2016',
            preisVorReduktion: 59.9,
            preissubsystem: 2,
            productMerkmale: ['a s e ', '22 asdg', '25 asgw ', 'sgww ss'],
            schemanummer: 0,
            sortierungsnummer: 107,
        },
        ...override,
    };
};

export const updatePreismeldung = (override: Partial<PreismeldungPricePayload> = {}) => ({
    ...{
        preis: '39.10',
        menge: '1',
        aktion: false,
        preisVorReduktion: '',
        mengeVorReduktion: '',
        preisVPK: '300',
        mengeVPK: null,
        bearbeitungscode: 99 as Models.Bearbeitungscode,
        artikelnummer: '',
        internetLink: '',
        artikeltext: 'gasglkwkg lasölg',
    },
    ...override,
});
