import { format } from 'date-fns';
import { maxBy } from 'lodash';

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

export function copyPreismeldungPropertiesFromRefPreismeldung(rpm: PreismeldungReference): Partial<Preismeldung> {
    return {
        pmsNummer: rpm.pmsNummer,
        epNummer: rpm.epNummer,
        laufnummer: rpm.laufnummer,
        preis: '',
        menge: '',
        preisVPK: '',
        mengeVPK: '',
        fehlendePreiseR: '',
        preisVorReduktion: '',
        mengeVorReduktion: '',
        datumVorReduktion: '',
        aktion: false,
        artikelnummer: rpm.artikelnummer,
        artikeltext: rpm.artikeltext,
        bemerkungen: '',
        notiz: rpm.notiz,
        erfasstAt: null,
        erhebungsZeitpunkt: rpm.erhebungsZeitpunkt,
        kommentar: '',
        productMerkmale: rpm.productMerkmale,
        modifiedAt: format(new Date()),
        bearbeitungscode: 99,
        uploadRequestedAt: null,
        istAbgebucht: false,
        d_DPToVP: createInitialPercentageWithWarning(),
        d_DPToVPVorReduktion: createInitialPercentageWithWarning(),
        d_DPToVPK: createInitialPercentageWithWarning(),
        d_VPKToVPAlterArtikel: createInitialPercentageWithWarning(),
        d_VPKToVPVorReduktion: createInitialPercentageWithWarning(),
        d_DPVorReduktionToVPVorReduktion: createInitialPercentageWithWarning(),
        d_DPVorReduktionToVP: createInitialPercentageWithWarning(),
        internetLink: rpm.internetLink,
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
