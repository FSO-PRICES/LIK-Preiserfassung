import { createSelector } from 'reselect';
import { isEqual, omit, merge } from 'lodash';

import * as P  from '../common-models';
import * as preismeldungen from '../actions/preismeldungen';

export interface PreismeldungViewModel {
    pmId: string;
    refPreismeldung?: P.PreismeldungReference;
    preismeldung: P.Preismeldung;
    warenkorbPosition: any
}

export type CurrentPreismeldungViewModel = PreismeldungViewModel & {
    isModified: boolean;
    isSaved: boolean;
};

export interface State {
    preismeldungIds: string[];
    entities: { [pmsNummer: string]: PreismeldungViewModel };
    currentPreismeldung: CurrentPreismeldungViewModel;
}

const initialState: State = {
    preismeldungIds: [],
    entities: {},
    currentPreismeldung: undefined,
};

// NOTE: only Preismeldungen for currently viewed Preismeldestelle are loaded into State

export function reducer(state = initialState, action: preismeldungen.Actions): State {
    switch (action.type) {
        case 'PREISMELDUNGEN_LOAD_SUCCESS': {
            const { payload } = action;
            const preismeldungViewModels = payload.refPreismeldungen
                .map<P.PreismeldungViewModel>(refPreismeldung => Object.assign({}, {
                    pmId: refPreismeldung.pmId,
                    refPreismeldung,
                    preismeldung: payload.preismeldungen.find(pm => pm._id === refPreismeldung.pmId),
                    warenkorbPosition: payload.warenkorbDoc.products.find(p => p.gliederungspositionsnummer === refPreismeldung.epNummer)
                }));

            const preismeldungIds = preismeldungViewModels.map(x => x.pmId);
            const entities = preismeldungViewModels.reduce((entities: { [_id: string]: P.PreismeldungViewModel }, preismeldung: P.PreismeldungViewModel) => {
                return Object.assign(entities, { [preismeldung.pmId]: preismeldung });
            }, {});
            return merge({}, state, { preismeldungIds, entities, currentPreismeldung: undefined });
        }

        case 'PREISMELDUNGEN_CLEAR': {
            return merge({}, state, { preismeldungIds: [], entities: {}, currentPreismeldung: undefined });
        }

        case 'SELECT_PREISMELDUNG': {
            const currentPreismeldung = Object.assign({}, getEntities(state)[action.payload], { isModified: false, isSaved: false });
            return merge({}, state, { currentPreismeldung });
        }

        case 'UPDATE_PREISMELDUNG_PRICE': {
            const { payload } = action;

            const valuesFromPayload = {
                preis: parseFloat(payload.currentPeriodPrice),
                menge: parseFloat(payload.currentPeriodQuantity),
                aktion: payload.reductionType === 'aktion',
                ausverkauf: payload.reductionType === 'ausverkauf',
                currentPeriodProcessingCode: 'STANDARD_ENTRY',
                artikelnummer: payload.artikelNummer,
                artikeltext: payload.artikelText
            };

            const currentPreismeldung = merge({},
                state.currentPreismeldung,
                { preismeldung: merge({}, state.currentPreismeldung.preismeldung, valuesFromPayload, createPercentages(state.currentPreismeldung, action.payload)) },
                { isModified: true }
            );

            return Object.assign({}, state, { currentPreismeldung });
        }

        case 'SAVE_PREISMELDUNG_PRICE_SUCCESS': {
            const currentPreismeldung = Object.assign({}, state.currentPreismeldung, { preismeldung: action.payload.preismeldung }, { isModified: false, isSaved: true });

            let nextPreismeldung;
            if (action.payload.saveAction === 'SAVE_AND_MOVE_TO_NEXT') {
                const index = state.preismeldungIds.findIndex(x => x === state.currentPreismeldung.pmId);
                const nextId = state.preismeldungIds[index + 1];
                nextPreismeldung = !!nextId ? Object.assign({}, state.entities[nextId], { isModified: false, isSaved: true }) : state.entities[0];
            } else {
                nextPreismeldung = currentPreismeldung;
            }

            return merge({}, state, { currentPreismeldung: nextPreismeldung, entities: Object.assign({}, state.entities, { [currentPreismeldung.pmId]: currentPreismeldung }) });
        }

        default:
            return state;
    }
}

function createPercentages(preismeldung: P.PreismeldungViewModel, payload: P.PreismeldungPricePayload) {
    return {
        percentageLastPeriodToCurrentPeriod: calculatePercentageChange(preismeldung.refPreismeldung.preis, preismeldung.refPreismeldung.menge, payload.currentPeriodPrice, payload.currentPeriodQuantity)
    }
}

function calculatePercentageChange(originalPrice: number, originalQuantity: number, newPrice: string, newQuantity: string) {
    const newPriceAsNumber = parseFloat(newPrice);
    const newQuantityAsNumber = parseFloat(newQuantity);

    if (isNaN(newPriceAsNumber) || newPriceAsNumber === 0 || isNaN(newQuantityAsNumber) || newQuantityAsNumber === 0) return NaN;

    const originalPriceFactored = originalPrice / originalQuantity;
    const newPriceFactored = newPriceAsNumber / newQuantityAsNumber;

    return (newPriceFactored - originalPriceFactored) / originalPriceFactored * 100;
}

export const getEntities = (state: State) => state.entities;
export const getPreismeldungIds = (state: State) => state.preismeldungIds;
export const getCurrentPreismeldung = (state: State) => state.currentPreismeldung;

export const getAll = createSelector(getEntities, getPreismeldungIds, (entities, preismeldungIds) => preismeldungIds.map(x => entities[x]));
