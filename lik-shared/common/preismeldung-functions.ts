import { format } from 'date-fns';
import { maxBy } from 'lodash';

import { Preismeldung, PreismeldungReference, PercentageWithWarning } from './models';
import { PreismeldungBag } from '../preismeldung-shared/models';

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
    const indexOfLastErfasst = preismeldungen.findIndex(
        pm => pm.pmId === maxBy(preismeldungen, bag => bag.preismeldung.erfasstAt).pmId
    );
    return indexOfLastErfasst !== -1 ? indexOfLastErfasst + 1 : -1;
}

function createInitialPercentageWithWarning(): PercentageWithWarning {
    return { percentage: null, warning: false, limitType: null, textzeil: null };
}
