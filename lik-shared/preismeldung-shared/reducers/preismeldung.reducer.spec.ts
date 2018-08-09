import { reducer } from './preismeldung.reducer';
import { CurrentPreismeldungBag, PreismeldungPricePayload } from '../../preismeldung-shared/models';
import { priceCountIdByPm } from '../../common/helper-functions';
import * as Models from '../../common/models';

type Overrides = {
    pm?: Partial<Models.Preismeldung>;
    refPm?: Partial<Models.PreismeldungReference>;
    wp?: Partial<Models.WarenkorbLeaf>;
};

type DeepPartial<T> = { [P in keyof T]?: Partial<T[P]> };

// prettier-ignore
const testData = {
    preismeldung: (overrides: Overrides = { pm: {}, refPm: {}, wp: {} }) => ({ pmId: 'pm_12453_ep_3024_lauf_3', preismeldung: { ...{ _id: 'pm_12453_ep_3024_lauf_3', _rev: '10-0b4c1e3494cad', pmsNummer: '12453', epNummer: '3024', laufnummer: '3', preis: '39.90', menge: '1', preisVPK: null, mengeVPK: null, fehlendePreiseR: '', preisVorReduktion: '39.90', mengeVorReduktion: '1', datumVorReduktion: '10.04.2018', aktion: false, artikelnummer: '', artikeltext: 'asgasg asg asg asgasg ', bemerkungen: '', notiz: '', erhebungsZeitpunkt: null, kommentar: '', productMerkmale: ['a s e ', '22 asdg', '25 asgw ', 'Short long'], modifiedAt: '2018-04-10T11:42:14.592+02:00', bearbeitungscode: 1, uploadRequestedAt: '2018-08-06T09:04:40.082Z', istAbgebucht: true, d_DPToVP: { percentage: -33.3889816360601, warning: false, limitType: null, textzeil: null }, d_DPToVPVorReduktion: { percentage: -33.3889816360601, warning: false, limitType: null, textzeil: null, }, d_DPToVPK: { percentage: null, warning: false, limitType: null, textzeil: null }, d_VPKToVPAlterArtikel: { percentage: null, warning: false, limitType: null, textzeil: null }, d_VPKToVPVorReduktion: { percentage: null, warning: false, limitType: null, textzeil: null }, d_DPVorReduktionToVPVorReduktion: { percentage: null, warning: false, limitType: null, textzeil: null }, d_DPVorReduktionToVP: { percentage: null, warning: false, limitType: null, textzeil: null }, internetLink: '', erfasstAt: 1523353334579, }, ...overrides.pm, }, refPreismeldung: { ...{ _id: 'pm-ref_12453_ep_3024_lauf_3', _rev: '1-237f792aaf2044besb7f4', pmId: 'pm_12453_ep_3024_lauf_3', preissubsystem: 2, schemanummer: 0, pmsNummer: '12453', epNummer: '3024', laufnummer: '3', preis: 59.9, menge: 1, aktion: false, artikeltext: 'ag asga sg asg', artikelnummer: '', preisGueltigSeitDatum: '01.04.2016', basisPreis: 59.9, basisMenge: 1, fehlendePreiseR: 'R', notiz: '', bemerkungen: '', internetLink: '', erhebungsZeitpunkt: null, erhebungsAnfangsDatum: '03.04.2018', erhebungsEndDatum: '12.04.2018', sortierungsnummer: 107, preisVorReduktion: 59.9, mengeVorReduktion: 1, datumVorReduktion: '', productMerkmale: ['gwgasg', '125 asga sg', '..', 'Short long'], }, ...overrides.refPm, }, sortierungsnummer: null, warenkorbPosition: { ...{ _id: '100/3/3001/3002/3003/3020/3024', type: 'LEAF', erhebungsschemaperiode: '01.04.2018', gliederungspositionsnummer: '3024', parentGliederungspositionsnummer: '3020', produktecode: null, gliederungspositionstyp: 6, tiefencode: 7, positionsbezeichnung: { de: 'asg asg asg asgwagws', fr: 'wagawsgasga s', it: 'wag asg asgasgw', en: null, }, periodizitaetscode: { de: 'M', fr: 'M', it: 'M', en: null }, standardmenge: 1, standardeinheit: { de: 'Stk', fr: 'pce', it: 'pz', en: null }, erhebungstyp: 'z_d', anzahlPreiseProPMS: 3, beispiele: { de: 'wgasg, wga, sgas', fr: 'lain, asgasg, sgw', it: 'lsgasgino, asgasg, gw', en: null }, info: null, periodizitaetMonat: 120, abweichungPmUG2: -70, abweichungPmOG2: 99, negativeLimite: -10, positiveLimite: 10, negativeLimite_1: -80, positiveLimite_1: 1000, negativeLimite_7: -80, positiveLimite_7: 1000, nichtEmpfohleneBc: [101, 44, 0, 2, 7], erhebungszeitpunkte: 0, productMerkmale: [ { de: 'asfasg', fr: 'wagsgsa', it: 'asgasf' }, { de: 'asgwgasg 1 (%)', fr: 'afsgas 1 (%)', it: 'agsag 1 (%)' }, { de: 'asgwgasg 2 (%)', fr: 'afsgas 2 (%)', it: 'agsag 2 (%)' }, { de: 'asg awga sg (gwwg, agsgs, wgw, usw.)', fr: 'asg asg w (gw, rrw, gs)', it: 'as gwagasg (agasgs, asgasg, wagsga, ecc.)', }, ], }, ...overrides.wp, }, exported: false, }),
    currentPreismeldung: (override: DeepPartial<CurrentPreismeldungBag> = {}) => ({ ...{ attributes: ["a s e ", "22 asdg", "25 asgw ", "Short long"], exported: false, hasAttributeWarning: false, hasMessageNotiz: false, hasMessageToCheck: false, hasPriceWarning: false, isAttributesModified: false, isMessagesModified: false, isModified: false, isNew: false, lastSaveAction: null, messages: { ...{ bemerkungen: "", isAdminApp: false, kommentar: "", kommentarAutotext: [], notiz: "" }, ...override.messages }, originalBearbeitungscode: 1, pmId: "pm_12453_ep_3024_lauf_3", preismeldung: { ...{ _id: "pm_12453_ep_3024_lauf_3", _rev: "10-0b4c1e3494cad", aktion: false, artikelnummer: "", artikeltext: "asgasg asg asg asgasg ", bearbeitungscode: 1, bemerkungen: "", d_DPToVP: { limitType: null, percentage: -33.3889816360601, textzeil: null, warning: false }, d_DPToVPK: { limitType: null, percentage: null, textzeil: null, warning: false }, d_DPToVPVorReduktion: { limitType: null, percentage: -33.3889816360601, textzeil: null, warning: false }, d_DPVorReduktionToVP: { limitType: null, percentage: null, textzeil: null, warning: false }, d_DPVorReduktionToVPVorReduktion: { limitType: null, percentage: null, textzeil: null, warning: false }, d_VPKToVPAlterArtikel: { limitType: null, percentage: null, textzeil: null, warning: false }, d_VPKToVPVorReduktion: { limitType: null, percentage: null, textzeil: null, warning: false }, datumVorReduktion: "10.04.2018", epNummer: "3024", erfasstAt: 1523353334579, erhebungsZeitpunkt: null, fehlendePreiseR: "", internetLink: "", istAbgebucht: true, kommentar: "", laufnummer: "3", menge: "1", mengeVPK: null, mengeVorReduktion: "1", modifiedAt: "2018-04-10T11:42:14.592+02:00", notiz: "", pmsNummer: "12453", preis: "39.90", preisVPK: null, preisVorReduktion: "39.90", productMerkmale: ["a s e ", "22 asdg", "25 asgw ", "Short long"], uploadRequestedAt: "2018-08-06T09:04:40.082Z" }, ...override.preismeldung }, priceCountStatus: undefined, refPreismeldung: { ...{ _id: "pm-ref_12453_ep_3024_lauf_3", _rev: "1-237f792aaf2044besb7f4", aktion: false, artikelnummer: "", artikeltext: "ag asga sg asg", basisMenge: 1, basisPreis: 59.9, bemerkungen: "", datumVorReduktion: "", epNummer: "3024", erhebungsAnfangsDatum: "03.04.2018", erhebungsEndDatum: "12.04.2018", erhebungsZeitpunkt: null, fehlendePreiseR: "R", internetLink: "", laufnummer: "3", menge: 1, mengeVorReduktion: 1, notiz: "", pmId: "pm_12453_ep_3024_lauf_3", pmsNummer: "12453", preis: 59.9, preisGueltigSeitDatum: "01.04.2016", preisVorReduktion: 59.9, preissubsystem: 2, productMerkmale: ["gwgasg", "125 asga sg", "..", "Short long"], schemanummer: 0, sortierungsnummer: 107 }, ...override.refPreismeldung }, sortierungsnummer: null, textzeile: [], warenkorbPosition: { ...{ _id: "100/3/3001/3002/3003/3020/3024", abweichungPmOG2: 99, abweichungPmUG2: -70, anzahlPreiseProPMS: 3, beispiele: { de: "wgasg, wga, sgas", en: null, fr: "lain, asgasg, sgw", it: "lsgasgino, asgasg, gw" }, erhebungsschemaperiode: "01.04.2018", erhebungstyp: "z_d", erhebungszeitpunkte: 0, gliederungspositionsnummer: "3024", gliederungspositionstyp: 6, info: null, negativeLimite: -10, negativeLimite_1: -80, negativeLimite_7: -80, nichtEmpfohleneBc: [101, 44, 0, 2, 7], parentGliederungspositionsnummer: "3020", periodizitaetMonat: 120, periodizitaetscode: { de: "M", en: null, fr: "M", it: "M" }, positionsbezeichnung: { de: "asg asg asg asgwagws", en: null, fr: "wagawsgasga s", it: "wag asg asgasgw" }, positiveLimite: 10, positiveLimite_1: 1000, positiveLimite_7: 1000, productMerkmale: [ { de: "asfasg", fr: "wagsgsa", it: "asgasf" }, { de: "asgwgasg 1 (%)", fr: "afsgas 1 (%)", it: "agsag 1 (%)" }, { de: "asgwgasg 2 (%)", fr: "afsgas 2 (%)", it: "agsag 2 (%)" }, { de: "asg awga sg (gwwg, agsgs, wgw, usw.)", fr: "asg asg w (gw, rrw, gs)", it: "as gwagasg (agasgs, asgasg, wagsga, ecc.)" } ], produktecode: null, standardeinheit: { de: "Stk", en: null, fr: "pce", it: "pz" }, standardmenge: 1, tiefencode: 7, type: "LEAF" }, ...override.warenkorbPosition } } }),
    updatePreismeldung: (override: Partial<PreismeldungPricePayload> = {}) => ({ ...{ preis: '39.10', menge: '1', aktion: false, preisVorReduktion: '', mengeVorReduktion: '', preisVPK: '300', mengeVPK: null, bearbeitungscode: 99 as any, artikelnummer: '', internetLink: '', artikeltext: 'YES OR NO shot bleu ciel bande blanch sur retour ', }, ...override, }),
};

// prettier-ignore
const reducerStates = (overrides: { loadedOverrides?: Overrides, currentOverrides?: Overrides, currentOverride?: DeepPartial<CurrentPreismeldungBag> } = {}) => ({
    loaded: { entities: { [testData.preismeldung(overrides.loadedOverrides).pmId]: testData.preismeldung(overrides.loadedOverrides) }, isAdminApp: false, priceCountStatuses: {}, } as any,
    withCurrent: { entities: { [testData.preismeldung(overrides.currentOverrides).pmId]: testData.preismeldung(overrides.loadedOverrides) }, currentPreismeldung: testData.currentPreismeldung(overrides.currentOverride), isAdminApp: false, priceCountStatuses: { [priceCountIdByPm(testData.preismeldung(overrides.loadedOverrides).preismeldung)]: {} }, } as any,
});

describe('Preismeldung reducer', () => {
    test('Reset sets state to initial state', () => {
        expect(reducer({} as any, { type: 'PREISMELDUNGEN_RESET', payload: null })).toEqual(
            reducer(undefined, { type: null })
        );
    });

    test('Select a preismeldung should set currentPreismeldung', () => {
        const currentPreismeldung = reducer(reducerStates().loaded, {
            type: 'SELECT_PREISMELDUNG',
            payload: testData.preismeldung().pmId,
        }).currentPreismeldung;
        delete currentPreismeldung.resetEvent;
        expect(currentPreismeldung).toEqual(testData.currentPreismeldung());
    });

    describe('Update Preismeldung', () => {
        test('with preisVPK without code 2 or 7 should not update preisVPK', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_PRICE',
                payload: testData.updatePreismeldung(),
            }).currentPreismeldung;
            expect(currentPreismeldung.preismeldung.preisVPK).not.toEqual(testData.updatePreismeldung().preisVPK);
        });

        test('with preisVPK with code 2 or 7 should update preisVPK', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_PRICE',
                payload: testData.updatePreismeldung({ bearbeitungscode: 2 as any }),
            }).currentPreismeldung;
            expect(currentPreismeldung.preismeldung.preisVPK).toEqual(testData.updatePreismeldung().preisVPK);
        });

        test('with preisVPK with code 0 and refPm being in Aktion should add correct autotext', () => {
            const currentPreismeldung = reducer(
                reducerStates({
                    currentOverride: { refPreismeldung: { aktion: true } },
                }).withCurrent,
                {
                    type: 'UPDATE_PREISMELDUNG_PRICE',
                    payload: testData.updatePreismeldung({ bearbeitungscode: 0 as any }),
                }
            ).currentPreismeldung;
            expect(currentPreismeldung.messages.kommentarAutotext).toContain(
                'kommentar-autotext_presta-setzt-normalpreis'
            );
        });

        test('with code R and refPm having a fehlendePreiseR already should result into two fehlendePreiseR', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_PRICE',
                payload: testData.updatePreismeldung({ bearbeitungscode: 101 as any }),
            }).currentPreismeldung;
            expect(currentPreismeldung.preismeldung.fehlendePreiseR).toEqual('RR');
        });

        test('with code R and refPm having no fehlendePreiseR yet should add 1 R', () => {
            const currentPreismeldung = reducer(
                reducerStates({ currentOverride: { refPreismeldung: { fehlendePreiseR: '' } } }).withCurrent,
                {
                    type: 'UPDATE_PREISMELDUNG_PRICE',
                    payload: testData.updatePreismeldung({ bearbeitungscode: 101 as any }),
                }
            ).currentPreismeldung;
            expect(currentPreismeldung.preismeldung.fehlendePreiseR).toEqual('R');
        });

        test('with too high price should add a autoKommentar and set priceWarning', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_PRICE',
                payload: testData.updatePreismeldung({
                    preis: '3000',
                }),
            }).currentPreismeldung;
            expect(currentPreismeldung.hasPriceWarning).toEqual(true);
            expect(currentPreismeldung.textzeile).toEqual(['text_textzeil_limitverletzung']);
        });

        test('with too high price and preisVPK with code 7 should add all relevant autoKommentar and set priceWarning', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_PRICE',
                payload: testData.updatePreismeldung({
                    preis: '3000',
                    bearbeitungscode: 7 as any,
                    preisVPK: '1000',
                    mengeVPK: '1',
                }),
            }).currentPreismeldung;
            expect(currentPreismeldung.hasPriceWarning).toEqual(true);
            expect(currentPreismeldung.textzeile).toEqual([
                'text_textzeil_limitverletzung',
                'text_textzeil_nicht_vergleichbar',
            ]);
        });
    });

    describe('Update preismeldung messages', () => {
        test('with empty bemerkungen when pmRef has got bemerkungen should set hasMessagesToCheck', () => {
            const currentPreismeldung = reducer(
                reducerStates({
                    currentOverride: {
                        messages: { bemerkungen: 'had values before' },
                        refPreismeldung: { bemerkungen: 'TO CHECK' },
                    },
                }).withCurrent,
                {
                    type: 'UPDATE_PREISMELDUNG_MESSAGES',
                    payload: {
                        isAdminApp: true,
                        notiz: '',
                        kommentar: '',
                        bemerkungen: '',
                    },
                }
            ).currentPreismeldung;
            expect(currentPreismeldung.hasMessageToCheck).toEqual(true);
        });
        test('with notizen should set hasMessageNotiz', () => {
            const currentPreismeldung = reducer(reducerStates().withCurrent, {
                type: 'UPDATE_PREISMELDUNG_MESSAGES',
                payload: {
                    isAdminApp: true,
                    notiz: 'show notiz flag',
                    kommentar: '',
                    bemerkungen: '',
                },
            }).currentPreismeldung;
            expect(currentPreismeldung.hasMessageNotiz).toEqual(true);
        });
    });
});
