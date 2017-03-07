import { createSelector } from 'reselect';
import { assign, cloneDeep, groupBy, keys, sortBy } from 'lodash';

import * as P  from '../common-models';
import * as preismeldungen from '../actions/preismeldungen';
import { preismeldungCompareFn } from 'lik-shared';

export interface PreismeldungBag {
    pmId: string;
    refPreismeldung?: P.Models.PreismeldungReference;
    preismeldung: P.Models.Preismeldung;
    warenkorbPosition: P.Models.WarenkorbLeaf;
    priceCountStatus: {
        text: string;
        ok: boolean
    };
}

export type CurrentPreismeldungBag = PreismeldungBag & {
    isModified: boolean;
    isNew: boolean;
};

export interface State {
    preismeldungIds: string[];
    entities: { [pmsNummer: string]: PreismeldungBag };
    currentPreismeldung: CurrentPreismeldungBag;
}

const initialState: State = {
    preismeldungIds: [],
    entities: {},
    currentPreismeldung: undefined
};

// NOTE: only Preismeldungen for currently viewed Preismeldestelle are loaded into State

export function reducer(state = initialState, action: preismeldungen.Actions): State {
    switch (action.type) {
        case 'PREISMELDUNGEN_LOAD_SUCCESS': {
            const { payload } = action;
            const refPreismeldungenGrouped = groupBy(payload.refPreismeldungen, 'epNummer');

            const preismeldungBags = sortBy(payload.preismeldungen, x => x.sortierungsnummer)
                .map<P.PreismeldungBag>(preismeldung => {
                    const warenkorbPosition = payload.warenkorbDoc.products.find(p => p.gliederungspositionsnummer === preismeldung.epNummer) as P.Models.WarenkorbLeaf;
                    return assign({}, {
                        pmId: preismeldung._id,
                        preismeldung,
                        refPreismeldung: payload.refPreismeldungen.find(rpm => rpm.pmId === preismeldung._id),
                        warenkorbPosition,
                        priceCountStatus: {
                            text: `${refPreismeldungenGrouped[warenkorbPosition.gliederungspositionsnummer].length}/${warenkorbPosition.anzahlPreiseProPMS}`,
                            ok: refPreismeldungenGrouped[warenkorbPosition.gliederungspositionsnummer].length >= warenkorbPosition.anzahlPreiseProPMS
                        }
                    });
                });

            const preismeldungIds = preismeldungBags.map(x => x.pmId);
            const entities = preismeldungBags.reduce((agg: { [_id: string]: P.PreismeldungBag }, preismeldung: P.PreismeldungBag) => {
                return assign(agg, { [preismeldung.pmId]: preismeldung });
            }, {});
            return assign({}, state, { preismeldungIds, entities, currentPreismeldung: undefined });
        }

        case 'PREISMELDUNGEN_CLEAR': {
            return assign({}, state, { preismeldungIds: [], entities: {}, currentPreismeldung: undefined });
        }

        case 'SELECT_PREISMELDUNG': {
            const currentPreismeldung = Object.assign({}, cloneDeep(state.entities[action.payload]), { isModified: false, isNew: false });
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
                { preismeldung: assign({}, state.currentPreismeldung.preismeldung, payload, createPercentages(state.currentPreismeldung, action.payload)) },
                { isModified: true }
            );

            return assign({}, state, { currentPreismeldung });
        }

        case 'SAVE_PREISMELDUNG_PRICE_SUCCESS': {
            const currentPreismeldung = Object.assign({}, state.currentPreismeldung, { preismeldung: action.payload.preismeldung }, { isModified: false });

            let nextPreismeldung;
            if (action.payload.saveAction === 'SAVE_AND_MOVE_TO_NEXT') {
                const index = state.preismeldungIds.findIndex(x => x === state.currentPreismeldung.pmId);
                const nextId = state.preismeldungIds[index + 1];
                nextPreismeldung = !!nextId ? assign({}, state.entities[nextId], { isModified: false }) : state.entities[0];
            } else {
                nextPreismeldung = currentPreismeldung;
            }

            return assign({}, state, { currentPreismeldung: nextPreismeldung, entities: Object.assign({}, state.entities, { [currentPreismeldung.pmId]: currentPreismeldung }) });
        }

        case 'DUPLICATE_PREISMELDUNG': {
            const pms = getAll(state).filter(x => x.warenkorbPosition.gliederungspositionsnummer === state.currentPreismeldung.warenkorbPosition.gliederungspositionsnummer);
            const nextLaufnummer = `${pms.map(x => +x.preismeldung.laufnummer).sort()[pms.length - 1] + 1}`;
            const currentPreismeldung = state.currentPreismeldung;
            const newPmId = `pm/${currentPreismeldung.preismeldung.pmsNummer}/ep/${currentPreismeldung.preismeldung.epNummer}/lauf/${nextLaufnummer}`;
            const newCurrentPreismeldung = assign({}, currentPreismeldung, {
                pmId: newPmId,
                isModified: true,
                isNew: true,
                refPreismeldung: null,
                preismeldung: assign(cloneDeep(currentPreismeldung.preismeldung), {
                    _id: newPmId,
                    _rev: null,
                    preis: null,
                    menge: null,
                    preisVPNormalNeuerArtikel: null,
                    mengeVPNormalNeuerArtikel: null,
                    aktion: false,
                    artikelnummer: null,
                    artikeltext: null,
                    internetLink: null,
                    bermerkungenAnsBfs: null,
                    percentageDPToLVP: null,
                    percentageDPToVPNeuerArtikel: null,
                    percentageVPNeuerArtikelToVPAlterArtikel: null,
                    modifiedAt: null,
                    bearbeitungscode: 100,
                    istAbgebucht: false,
                    uploadRequestedAt: null
                }),
                priceCountStatus: {
                    text: `${pms.length + 1}/${currentPreismeldung.warenkorbPosition.anzahlPreiseProPMS}`,
                    ok: pms.length >= currentPreismeldung.warenkorbPosition.anzahlPreiseProPMS
                }
            });

            return assign({}, state, { currentPreismeldung: newCurrentPreismeldung });
            // console.log(newCurrentPreismeldung);

            // return state;
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
        percentageDPToLVP: !preismeldung.refPreismeldung ? NaN : calculatePercentageChange(preismeldung.refPreismeldung.preis, preismeldung.refPreismeldung.menge, parseFloat(payload.preis), parseFloat(payload.menge)),
        percentageDPToVPNeuerArtikel: calculatePercentageChange(parseFloat(payload.preisVPNormalNeuerArtikel), parseFloat(payload.mengeVPNormalNeuerArtikel), parseFloat(payload.preis), parseFloat(payload.menge)),
        percentageVPNeuerArtikelToVPAlterArtikel: !preismeldung.refPreismeldung ? NaN : calculatePercentageChange(preismeldung.refPreismeldung.preis, preismeldung.refPreismeldung.menge, parseFloat(payload.preisVPNormalNeuerArtikel), parseFloat(payload.mengeVPNormalNeuerArtikel))
    };
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

export const getAll = createSelector(getEntities, getPreismeldungIds, (entities, preismeldungIds) => preismeldungIds.map(x => entities[x]));
