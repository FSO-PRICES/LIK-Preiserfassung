import { createSelector } from 'reselect';
import { Preismeldestelle }  from '../common-models';
import * as preismeldestellen from '../actions/preismeldestellen';

export interface State {
    pmsKeys: string[];
    entities: { [pmsKey: string]: Preismeldestelle };
    selectedPmsKey: string;
}

const initialState: State = {
    pmsKeys: [],
    entities: {},
    selectedPmsKey: undefined,
};

export function reducer(state = initialState, action: preismeldestellen.Actions): State {
    switch (action.type) {
        case 'PREISMELDESTELLEN_LOAD_SUCCESS': {
            const pmsKeys = action.payload.map(x => x.pmsKey);
            const entities = action.payload.reduce((entities: { [pmsKey: string]: Preismeldestelle }, preismeldestelle: Preismeldestelle) => {
                return Object.assign(entities, { [preismeldestelle.pmsKey]: preismeldestelle });
            }, {});
            return Object.assign({}, state, { pmsKeys, entities });
        }

        case 'PREISMELDESTELLE_SELECT':
            return Object.assign({}, state, { selectedPmsKey: action.payload });

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPmsKeys = (state: State) => state.pmsKeys;
export const getSelectedPmsKey = (state: State) => state.selectedPmsKey;

export const getSelected = createSelector(getEntities, getSelectedPmsKey, (entities, selectedPmsKey) => entities[selectedPmsKey]);
export const getAll = createSelector(getEntities, getPmsKeys, (entities, pmsKeys) => pmsKeys.map(x => entities[x]));
