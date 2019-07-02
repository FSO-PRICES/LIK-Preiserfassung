var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
import { warenkorbLeaf } from './warenkorb';
import { preismeldungRefId, preismeldungId } from '../../common/helper-functions';
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
export var currentPreismeldung = function (override) {
    if (override === void 0) { override = {}; }
    var pm = preismeldung(override.preismeldung || {});
    return __assign({ attributes: pm.productMerkmale, exported: false, hasAttributeWarning: false, hasMessageNotiz: false, hasMessageToCheck: false, hasPriceWarning: false, isAttributesModified: false, isMessagesModified: false, isModified: false, isNew: false, lastSaveAction: null, messages: __assign({ bemerkungen: '', isAdminApp: false, kommentar: '', kommentarAutotext: [], notiz: '' }, override.messages), originalBearbeitungscode: 1, pmId: pm._id, sortierungsnummer: null, textzeile: [], priceCountStatus: { numActivePrices: 1, anzahlPreiseProPMS: 1, ok: true, enough: true }, resetEvent: 1234 }, {
        preismeldung: pm,
        refPreismeldung: preismeldungReference(override.refPreismeldung, override.preismeldung),
        warenkorbPosition: warenkorbLeaf(override.warenkorbPosition),
    });
};
export var preismeldung = function (override) {
    if (override === void 0) { override = {}; }
    var pmsNummer = override.pmsNummer || '12453';
    var epNummer = override.epNummer || '3024';
    var laufnummer = override.laufnummer || '3';
    return __assign({
        _id: preismeldungId(pmsNummer, epNummer, laufnummer),
        _rev: '10-0b4c1s4cad',
        aktion: false,
        artikelnummer: '',
        artikeltext: 'asgasg asg asg asgasg ',
        bearbeitungscode: 1,
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
        epNummer: epNummer,
        erfasstAt: 1523353334579,
        erhebungsZeitpunkt: null,
        fehlendePreiseR: '',
        internetLink: '',
        istAbgebucht: true,
        kommentar: '',
        laufnummer: laufnummer,
        menge: '1',
        mengeVPK: null,
        mengeVorReduktion: '1',
        modifiedAt: '2018-04-10T11:42:14.592+02:00',
        notiz: '',
        pmsNummer: pmsNummer,
        preis: '39.90',
        preisVPK: null,
        preisVorReduktion: '39.90',
        productMerkmale: ['a s e ', '22 asdg', '25 asgw ', 'sgww ss'],
        uploadRequestedAt: '2018-08-06T09:04:40.082Z',
    }, override);
};
export var preismeldungReference = function (override, pm) {
    if (override === void 0) { override = {}; }
    if (pm === void 0) { pm = {}; }
    var pmsNummer = pm.pmsNummer || override.pmsNummer || '12453';
    var epNummer = pm.epNummer || override.epNummer || '3024';
    var laufnummer = pm.laufnummer || override.laufnummer || '3';
    return __assign({
        _id: preismeldungRefId(pmsNummer, epNummer, laufnummer),
        _rev: '1-237ssb7f4',
        aktion: false,
        artikelnummer: '',
        artikeltext: 'ag asga sg asg',
        basisMenge: 1,
        basisPreis: 59.9,
        bemerkungen: '',
        datumVorReduktion: '',
        epNummer: epNummer,
        erhebungsAnfangsDatum: '03.04.2018',
        erhebungsEndDatum: '12.04.2018',
        erhebungsZeitpunkt: null,
        fehlendePreiseR: null,
        internetLink: '',
        laufnummer: laufnummer,
        menge: 1,
        mengeVorReduktion: 1,
        notiz: '',
        pmId: preismeldungId(pmsNummer, epNummer, laufnummer),
        pmsNummer: pmsNummer,
        preis: 59.9,
        preisGueltigSeitDatum: '01.04.2016',
        preisVorReduktion: 59.9,
        preissubsystem: 2,
        productMerkmale: ['a s e ', '22 asdg', '25 asgw ', 'sgww ss'],
        schemanummer: 0,
        sortierungsnummer: 107,
    }, override);
};
export var updatePreismeldung = function (override) {
    if (override === void 0) { override = {}; }
    return (__assign({
        preis: '39.10',
        menge: '1',
        aktion: false,
        preisVorReduktion: '',
        mengeVorReduktion: '',
        preisVPK: '300',
        mengeVPK: null,
        bearbeitungscode: 99,
        artikelnummer: '',
        internetLink: '',
        artikeltext: 'gasglkwkg lasölg',
    }, override));
};
//# sourceMappingURL=preismeldung.js.map