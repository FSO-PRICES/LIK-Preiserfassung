import { createSelector } from 'reselect';
import { assign, cloneDeep, sortBy, keys } from 'lodash';

import * as P  from '../common-models';
import * as preismeldungen from '../actions/preismeldungen';

export interface PreismeldungBag {
    pmId: string;
    refPreismeldung?: P.Models.PreismeldungReference;
    sortierungsnummer: number;
    preismeldung: P.Models.Preismeldung;
    warenkorbPosition: P.Models.WarenkorbLeaf;
}

export type CurrentPreismeldungBag = PreismeldungBag & {
    isModified: boolean;
    isNew: boolean;
    priceCountStatus: PriceCountStatus;
    originalBearbeitungscode: P.Models.Bearbeitungscode;
    lastSaveAction: P.SavePreismeldungPricePayloadType
};

export interface PriceCountStatus {
    numActivePrices: number;
    anzahlPreiseProPMS: number;
    ok: boolean;
    enough: boolean;
}

export type PriceCountStatusMap = { [pmsNummer: string]: PriceCountStatus };

export interface State {
    pmsNummer: string;
    preismeldungIds: string[];
    entities: { [pmsNummer: string]: PreismeldungBag };
    currentPreismeldung: CurrentPreismeldungBag;
    priceCountStatuses: PriceCountStatusMap;
}

const initialState: State = {
    pmsNummer: null,
    preismeldungIds: [],
    entities: {},
    currentPreismeldung: null,
    priceCountStatuses: {}
};

// NOTE: only Preismeldungen for currently viewed Preismeldestelle are loaded into State

export function reducer(state = initialState, action: preismeldungen.Actions): State {
    switch (action.type) {
        case 'PREISMELDUNGEN_LOAD_SUCCESS': {
            const { payload } = action;

            const preismeldungBags = payload.preismeldungen
                .map<P.PreismeldungBag>(preismeldung => {
                    const warenkorbPosition = payload.warenkorb.find(p => p.warenkorbItem.gliederungspositionsnummer === preismeldung.epNummer).warenkorbItem as P.Models.WarenkorbLeaf;
                    return assign({}, {
                        pmId: preismeldung._id,
                        preismeldung,
                        refPreismeldung: payload.refPreismeldungen.find(rpm => rpm.pmId === preismeldung._id),
                        sortierungsnummer: payload.pmsPreismeldungenSort.sortOrder.find(s => s.pmId === preismeldung._id).sortierungsnummer,
                        warenkorbPosition
                    });
                });

            const preismeldungIds = sortBy(preismeldungBags, x => x.sortierungsnummer).map(x => x.pmId);
            const entities = preismeldungBags.reduce((agg: { [_id: string]: P.PreismeldungBag }, preismeldungBag: P.PreismeldungBag) => assign(agg, { [preismeldungBag.pmId]: preismeldungBag }), {});
            const priceCountStatuses = createPriceCountStatuses(entities);
            return assign({}, state, { pmsNummer: action.payload.pms.pmsNummer, preismeldungIds, entities, currentPreismeldung: null, priceCountStatuses });
        }

        case 'PREISMELDUNGEN_RESET':
            return assign({}, initialState);

        case 'SELECT_PREISMELDUNG': {
            const entity = state.entities[action.payload];
            const currentPreismeldung = !action.payload ? null : Object.assign({}, cloneDeep(entity), { priceCountStatus: state.priceCountStatuses[entity.preismeldung.epNummer], isModified: false, isNew: false, originalBearbeitungscode: entity.preismeldung.bearbeitungscode });
            return assign({}, state, { currentPreismeldung });
        }

        case 'UPDATE_PREISMELDUNG_PRICE': {
            const { payload } = action;

            // debugDifference(state.currentPreismeldung.preismeldung, payload, ['preis', 'menge', 'preisVPNormalNeuerArtikel', 'mengeVPNormalNeuerArtikel', 'aktion', 'bearbeitungscode', 'artikelnummer', 'artikeltext']);

            if (state.currentPreismeldung.preismeldung.preis === payload.preis
                && state.currentPreismeldung.preismeldung.menge === payload.menge
                && state.currentPreismeldung.preismeldung.preisVPNormalNeuerArtikel === payload.preisVPNormalNeuerArtikel
                && state.currentPreismeldung.preismeldung.mengeVPNormalNeuerArtikel === payload.mengeVPNormalNeuerArtikel
                && state.currentPreismeldung.preismeldung.aktion === payload.aktion
                && state.currentPreismeldung.preismeldung.bearbeitungscode === payload.bearbeitungscode
                && state.currentPreismeldung.preismeldung.artikelnummer === payload.artikelnummer
                && state.currentPreismeldung.preismeldung.artikeltext === payload.artikeltext) { return state; }

            const currentPreismeldung = assign({},
                state.currentPreismeldung,
                { preismeldung: assign({}, state.currentPreismeldung.preismeldung, payload, createPercentages(state.currentPreismeldung, action.payload), createFehlendePreiseR(state.currentPreismeldung, action.payload)) },
                createNewPriceCountStatus(state.currentPreismeldung, state.priceCountStatuses[state.currentPreismeldung.preismeldung.epNummer], action.payload),
                { isModified: true }
            );

            return assign({}, state, { currentPreismeldung });
        }

        case 'SAVE_PREISMELDUNG_PRICE_SUCCESS': {
            const currentPreismeldung = assign({}, state.currentPreismeldung, { preismeldung: action.payload.preismeldung }, { isModified: false, lastSaveAction: action.payload.saveAction });

            let nextPreismeldung;
            if (action.payload.saveAction === 'SAVE_AND_MOVE_TO_NEXT') {
                const index = state.preismeldungIds.findIndex(x => x === state.currentPreismeldung.pmId);
                const nextId = state.preismeldungIds[index + 1];
                const preismeldungToMakeCurrent = !!nextId ? state.entities[nextId] : state.entities[0];
                nextPreismeldung = assign({}, preismeldungToMakeCurrent, { priceCountStatus: state.priceCountStatuses[preismeldungToMakeCurrent.preismeldung.epNummer], isModified: false, isNew: false, originalBearbeitungscode: preismeldungToMakeCurrent.preismeldung.bearbeitungscode });
            } else {
                nextPreismeldung = cloneDeep(currentPreismeldung);
            }

            const entities = assign({}, state.entities, { [currentPreismeldung.pmId]: assign({}, currentPreismeldung) });

            return assign({}, state, { currentPreismeldung: nextPreismeldung, entities, priceCountStatuses: createPriceCountStatuses(entities) });
        }

        case 'SAVE_NEW_PREISMELDUNG_PRICE_SUCCESS': {
            const currentPreismeldung = assign({}, state.currentPreismeldung, { preismeldung: action.payload.preismeldung }, { isModified: false, isNew: false });
            const preismeldungIds = action.payload.pmsPreismeldungenSort.sortOrder.map(x => x.pmId);
            const entities = assign({}, state.entities, { [currentPreismeldung.pmId]: assign({}, currentPreismeldung) });

            return assign({}, state, {
                currentPreismeldung,
                entities,
                preismeldungIds,
                priceCountStatuses: createPriceCountStatuses(entities)
            });
        }

        case 'DUPLICATE_PREISMELDUNG': {
            const preismeldungen = getAll(state).filter(x => x.warenkorbPosition.gliederungspositionsnummer === state.currentPreismeldung.warenkorbPosition.gliederungspositionsnummer);
            const nextLaufnummer = `${preismeldungen.map(x => +x.preismeldung.laufnummer).sort()[preismeldungen.length - 1] + 1}`;
            const currentPreismeldung = state.currentPreismeldung;
            const newPmId = `pm/${currentPreismeldung.preismeldung.pmsNummer}/ep/${currentPreismeldung.preismeldung.epNummer}/lauf/${nextLaufnummer}`;
            const newCurrentPreismeldung = assign({}, currentPreismeldung, {
                pmId: newPmId,
                isModified: true,
                isNew: true,
                refPreismeldung: null,
                priceCountStatus: createPriceCountStatus(currentPreismeldung.priceCountStatus.numActivePrices + 1, currentPreismeldung.priceCountStatus.anzahlPreiseProPMS),
                originalBearbeitungscode: action.payload,
                preismeldung: assign(cloneDeep(currentPreismeldung.preismeldung), {
                    _id: newPmId,
                    _rev: null,
                    laufnummer: nextLaufnummer,
                    preis: null,
                    menge: null,
                    preisVPNormalNeuerArtikel: null,
                    mengeVPNormalNeuerArtikel: null,
                    aktion: false,
                    artikelnummer: null,
                    artikeltext: null,
                    internetLink: null,
                    bermerkungenAnsBfs: null,
                    percentageDPToVP: null,
                    percentageDPToVPNeuerArtikel: null,
                    percentageVPNeuerArtikelToVPAlterArtikel: null,
                    modifiedAt: null,
                    bearbeitungscode: action.payload,
                    istAbgebucht: false,
                    uploadRequestedAt: null
                }),
                sortierungsnummer: currentPreismeldung.sortierungsnummer + 1
            });

            return assign({}, state, { currentPreismeldung: newCurrentPreismeldung });
        }

        case 'NEW_PREISMELDUNG': {
            const allPreismeldungen = getAll(state);
            const preismeldungen = getAll(state).filter(x => x.warenkorbPosition.gliederungspositionsnummer === action.payload.warenkorbPosition.gliederungspositionsnummer);
            const nextLaufnummer = `${preismeldungen.length === 0 ? 1 : preismeldungen.map(x => +x.preismeldung.laufnummer).sort()[preismeldungen.length - 1] + 1}`;
            const newPmId = `pm/${action.payload.pmsNummer}/ep/${action.payload.warenkorbPosition.gliederungspositionsnummer}/lauf/${nextLaufnummer}`;
            const sortierungsnummer = preismeldungen.length === 0 ? allPreismeldungen[allPreismeldungen.length - 1].sortierungsnummer + 1 : sortBy(preismeldungen, x => x.sortierungsnummer)[0].sortierungsnummer + 1;
            const priceCountStatus = state.priceCountStatuses[action.payload.warenkorbPosition.gliederungspositionsnummer];
            const numActivePrices = !priceCountStatus ? 0 : priceCountStatus.numActivePrices;
            const newCurrentPreismeldung = {
                pmId: newPmId,
                isModified: true,
                isNew: true,
                refPreismeldung: null,
                warenkorbPosition: action.payload.warenkorbPosition,
                originalBearbeitungscode: action.payload.bearbeitungscode,
                priceCountStatus: createPriceCountStatus(numActivePrices + 1, action.payload.warenkorbPosition.anzahlPreiseProPMS),
                preismeldung: {
                    _id: newPmId,
                    _rev: null,
                    pmsNummer: action.payload.pmsNummer,
                    epNummer: action.payload.warenkorbPosition.gliederungspositionsnummer,
                    laufnummer: nextLaufnummer,
                    preis: null,
                    menge: null,
                    preisVPNormalNeuerArtikel: null,
                    mengeVPNormalNeuerArtikel: null,
                    aktion: false,
                    artikelnummer: null,
                    artikeltext: null,
                    internetLink: null,
                    bermerkungenAnsBfs: null,
                    percentageDPToVP: null,
                    percentageDPToVPNeuerArtikel: null,
                    percentageVPNeuerArtikelToVPAlterArtikel: null,
                    modifiedAt: null,
                    bearbeitungscode: action.payload.bearbeitungscode,
                    istAbgebucht: false,
                    uploadRequestedAt: null
                },
                sortierungsnummer
            };

            return assign({}, state, { currentPreismeldung: newCurrentPreismeldung });
        }

        default:
            return state;
    }
}

function debugDifference(obj1: any, obj2: any, props: string[]) {
    props.forEach(p => {
        console.log(p, obj1[p], obj2[p], obj1[p] === obj2[p]);
    });
}

function createPercentages(preismeldung: P.PreismeldungBag, payload: P.PreismeldungPricePayload) {
    return {
        percentageDPToVP: !preismeldung.refPreismeldung ? NaN : calculatePercentageChange(preismeldung.refPreismeldung.preis, preismeldung.refPreismeldung.menge, parseFloat(payload.preis), parseFloat(payload.menge)),
        percentageDPToVPVorReduktion: !preismeldung.refPreismeldung ? NaN : calculatePercentageChange(preismeldung.refPreismeldung.preisVorReduktion, preismeldung.refPreismeldung.mengeVorReduktion, parseFloat(payload.preis), parseFloat(payload.menge)),
        percentageDPToVPNeuerArtikel: calculatePercentageChange(parseFloat(payload.preisVPNormalNeuerArtikel), parseFloat(payload.mengeVPNormalNeuerArtikel), parseFloat(payload.preis), parseFloat(payload.menge)),
        percentageVPNeuerArtikelToVPAlterArtikel: !preismeldung.refPreismeldung ? NaN : calculatePercentageChange(preismeldung.refPreismeldung.preis, preismeldung.refPreismeldung.menge, parseFloat(payload.preisVPNormalNeuerArtikel), parseFloat(payload.mengeVPNormalNeuerArtikel))
    };
}

function createPriceCountStatuses(entities: { [pmsNummer: string]: PreismeldungBag }) {
    const preismeldungBags = keys(entities).map(id => entities[id]);
    return preismeldungBags.reduce((agg, preismeldungBag) => {
        const numActivePrices = preismeldungBags.filter(b => b.preismeldung.epNummer === preismeldungBag.preismeldung.epNummer && b.preismeldung.bearbeitungscode !== 0).length;
        return assign(agg, {
            [preismeldungBag.preismeldung.epNummer]: createPriceCountStatus(numActivePrices, preismeldungBag.warenkorbPosition.anzahlPreiseProPMS)
        });
    }, {});
}

function createPriceCountStatus(numActivePrices: number, anzahlPreiseProPMS: number) {
    return {
        numActivePrices,
        anzahlPreiseProPMS: anzahlPreiseProPMS,
        ok: numActivePrices === anzahlPreiseProPMS,
        enough: numActivePrices >= anzahlPreiseProPMS
    };
}

function createFehlendePreiseR(preismeldung: CurrentPreismeldungBag, payload: P.PreismeldungPricePayload) {
    return {
        fehlendePreiseR: payload.bearbeitungscode === 101 ? (preismeldung.refPreismeldung.fehlendePreiseR || '') + 'R' : ''
    };
}

function createNewPriceCountStatus(preismeldung: CurrentPreismeldungBag, originalPriceCountStatus: PriceCountStatus, payload: P.PreismeldungPricePayload) {
    let priceCountStatus = preismeldung.priceCountStatus;

    if (preismeldung.originalBearbeitungscode === 0 && payload.bearbeitungscode !== 0) {
        priceCountStatus = createPriceCountStatus(originalPriceCountStatus.numActivePrices + 1, originalPriceCountStatus.anzahlPreiseProPMS);
    }

    if (preismeldung.originalBearbeitungscode !== 0 && payload.bearbeitungscode === 0) {
        priceCountStatus = createPriceCountStatus(originalPriceCountStatus.numActivePrices - 1, originalPriceCountStatus.anzahlPreiseProPMS);
    }

    return { priceCountStatus };
}

function calculatePercentageChange(price1: number, quantity1: number, price2: number, quantity2: number) {
    if (isNaN(price1) || isNaN(quantity1)) return NaN;
    if (isNaN(price2) || price2 === 0 || isNaN(quantity2) || quantity2 === 0) return NaN;

    const originalPriceFactored = price1 / quantity1;
    const newPriceFactored = price2 / quantity2;

    return (newPriceFactored - originalPriceFactored) / originalPriceFactored * 100;
}

export const getEntities = (state: State) => state.entities;
export const getPreismeldungIds = (state: State) => state.preismeldungIds;
export const getCurrentPreismeldung = (state: State) => state.currentPreismeldung;
export const getPriceCountStatuses = (state: State) => state.priceCountStatuses;

export const getAll = createSelector(getEntities, getPreismeldungIds, (entities, preismeldungIds) => preismeldungIds.map(x => entities[x]));
