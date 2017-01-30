import { createSelector } from 'reselect';
import { isEqual, omit } from 'lodash';

import * as P  from '../common-models';
import * as preismeldungen from '../actions/preismeldungen';

export type CurrentPreismeldung = P.Preismeldung & {
    isModified: boolean;
    isSaved: boolean;
};

export interface State {
    preismeldungIds: string[];
    entities: { [pmsKey: string]: P.Preismeldung };
    currentPreismeldung: CurrentPreismeldung;
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
            const preismeldungIds = action.payload.map(x => (x as any)._id);
            const entities = action.payload.reduce((entities: { [_id: string]: P.Preismeldung }, preismeldung: P.Preismeldung) => {
                return Object.assign(entities, { [preismeldung._id]: preismeldung });
            }, {});
            return Object.assign({}, state, { preismeldungIds, entities, currentPreismeldung: undefined });
        }

        case 'PREISMELDUNGEN_CLEAR': {
            return Object.assign({}, state, { preismeldungIds: [], entities: {}, currentPreismeldung: undefined });
        }

        case 'SELECT_PREISMELDUNG': {
            const currentPreismeldung = Object.assign({}, getEntities(state)[action.payload], { isModified: false, isSaved: false });
            return Object.assign({}, state, { currentPreismeldung });
        }

        case 'UPDATE_PREISMELDUNG_PRICE': {
            const { payload } = action;

            const valuesFromPayload = {
                isModified: true,
                currentPeriodPrice: parseFloat(payload.currentPeriodPrice),
                currentPeriodQuantity: parseFloat(payload.currentPeriodQuantity),
                currentPeriodIsAktion: payload.reductionType === 'aktion',
                currentPeriodIsAusverkauf: payload.reductionType === 'ausverkauf',
                currentPeriodProcessingCode: payload.currentPeriodProcessingCode,
                artikelNummer: payload.artikelNummer,
                artikelText: payload.artikelText
            };

            const currentPreismeldung = Object.assign({}, state.currentPreismeldung, valuesFromPayload, createPercentages(state.currentPreismeldung, action.payload));
            return Object.assign({}, state, { currentPreismeldung });
        }

        case 'SAVE_PREISMELDUNG_PRICE': {
            let nextPriesmeldung;
            if (action.payload.saveAction === 'SAVE_AND_MOVE_TO_NEXT') {
                const index = state.preismeldungIds.findIndex(x => x === state.currentPreismeldung._id);
                const nextId = state.preismeldungIds[index + 1];
                nextPriesmeldung = !!nextId ? Object.assign({}, getEntities(state)[nextId], { isModified: false, isSaved: false }) : state.currentPreismeldung;
            } else {
                nextPriesmeldung = state.currentPreismeldung;
            }

            const currentPreismeldung = Object.assign({}, state.currentPreismeldung, { isModified: false, isSaved: true });
            // TODO EFFECT!!! -- SUCCESS
            // return Object.assign({}, state, { currentPreismeldung: nextPriesmeldung });
            return Object.assign({}, state, { currentPreismeldung: nextPriesmeldung, entities: Object.assign({}, state.entities, { [currentPreismeldung._id]: currentPreismeldung }) });
        }

        default:
            return state;
    }
}

function createPercentages(preismeldung: P.Preismeldung, payload: P.PreismeldungPricePayload) {
    return {
        percentageLastPeriodToCurrentPeriod: calculatePercentageChange(preismeldung.preisT, preismeldung.mengeT, payload.currentPeriodPrice, payload.currentPeriodQuantity)
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
