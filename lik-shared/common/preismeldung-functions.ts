import { PreismeldungReference, PercentageWithWarning } from './models';
import { format } from 'date-fns';

type PreismeldungSortShape = { sortierungsnummer: number; epNummer: string; laufnummer: string };

export function preismeldungCompareFn(a: PreismeldungSortShape, b: PreismeldungSortShape) {
    if (a.sortierungsnummer == null) return 1;
    if (b.sortierungsnummer == null) return -1;
    return (
        a.sortierungsnummer - b.sortierungsnummer ||
        parseInt(a.epNummer) - parseInt(b.epNummer) ||
        parseInt(a.laufnummer) - parseInt(b.laufnummer)
    );
}

export function copyPreismeldungPropertiesFromRefPreismeldung(rpm: PreismeldungReference) {
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

function createInitialPercentageWithWarning(): PercentageWithWarning {
    return { percentage: null, warning: false, limitType: null, textzeil: null };
}
