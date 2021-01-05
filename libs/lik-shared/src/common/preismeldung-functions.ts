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

import { format } from 'date-fns';

import { PreismeldungBag } from '../preismeldung-shared/models';
import { PercentageWithWarning, Preismeldung, PreismeldungReference } from './models';

type PreismeldungSortShape = { sortierungsnummer: number; epNummer: string; laufnummer: string };

export function preismeldungCompareFn(a: PreismeldungSortShape, b: PreismeldungSortShape) {
    if (a.sortierungsnummer == null) return 1;
    if (b.sortierungsnummer == null) return -1;
    return (
        a.sortierungsnummer - b.sortierungsnummer ||
        parseInt(a.epNummer, 10) - parseInt(b.epNummer, 10) ||
        parseInt(a.laufnummer, 10) - parseInt(b.laufnummer, 10)
    );
}

export function copyPreismeldungPropertiesFromRefPreismeldung(
    rpm: PreismeldungReference,
    beendet = false,
): Partial<Preismeldung> {
    return {
        pmsNummer: rpm.pmsNummer,
        epNummer: rpm.epNummer,
        laufnummer: rpm.laufnummer,
        preisVPK: '',
        mengeVPK: '',
        fehlendePreiseR: '',
        preisVorReduktion: `${rpm.preisVorReduktion}`,
        mengeVorReduktion: `${rpm.mengeVorReduktion}`,
        datumVorReduktion: rpm.datumVorReduktion,
        aktion: beendet ? rpm.aktion : false,
        artikelnummer: rpm.artikelnummer,
        artikeltext: rpm.artikeltext,
        bemerkungen: '',
        notiz: rpm.notiz,
        erhebungsZeitpunkt: rpm.erhebungsZeitpunkt,
        kommentar: '',
        productMerkmale: rpm.productMerkmale,
        modifiedAt: format(new Date()),
        uploadRequestedAt: null,
        istAbgebucht: false,
        internetLink: rpm.internetLink,
        ...(beendet
            ? {}
            : {
                  preis: '',
                  menge: '',
                  bearbeitungscode: 99,
                  erfasstAt: null,
                  d_DPToVP: createInitialPercentageWithWarning(),
                  d_DPToVPVorReduktion: createInitialPercentageWithWarning(),
                  d_DPToVPK: createInitialPercentageWithWarning(),
                  d_VPKToVPAlterArtikel: createInitialPercentageWithWarning(),
                  d_VPKToVPVorReduktion: createInitialPercentageWithWarning(),
                  d_DPVorReduktionToVPVorReduktion: createInitialPercentageWithWarning(),
                  d_DPVorReduktionToVP: createInitialPercentageWithWarning(),
              }),
    };
}

export function getNextIndexForRecMode(preismeldungen: PreismeldungBag[]) {
    let nextIndex = -1;
    let maxErfasstAt = 0;
    preismeldungen.forEach((bag, i) => {
        if (
            (!!bag.preismeldung.erfasstAt && bag.preismeldung.erfasstAt >= maxErfasstAt) ||
            !!bag.preismeldung.uploadRequestedAt
        ) {
            maxErfasstAt = bag.preismeldung.erfasstAt;
            nextIndex = i;
        }
    });
    return nextIndex !== -1 ? nextIndex + 1 : 0;
}

function createInitialPercentageWithWarning(): PercentageWithWarning {
    return { percentage: null, warning: false, limitType: null, textzeil: null };
}
