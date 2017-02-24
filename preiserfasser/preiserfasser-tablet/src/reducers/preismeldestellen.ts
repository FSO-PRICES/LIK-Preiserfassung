import { createSelector } from 'reselect';
import * as P  from '../common-models';
import * as preismeldestellen from '../actions/preismeldestellen';
import { assign, cloneDeep } from 'lodash';

export interface State {
    pmsNummers: string[];
    entities: { [pmsNummer: string]: P.Models.Preismeldestelle };
    currentPreismeldestelle: P.Models.Preismeldestelle;
}

const initialState: State = {
    pmsNummers: [],
    entities: {},
    currentPreismeldestelle: undefined
};

export function reducer(state = initialState, action: preismeldestellen.Actions): State {
    switch (action.type) {
        case 'PREISMELDESTELLEN_LOAD_SUCCESS': {
            const pmsNummers = action.payload.map(x => x.pmsNummer);
            const entities = action.payload.reduce((agg: { [pmsNummer: string]: P.Models.Preismeldestelle }, preismeldestelle: P.Models.Preismeldestelle) => {
                return assign(agg, { [preismeldestelle.pmsNummer]: preismeldestelle });
            }, {});
            return assign({}, state, { pmsNummers, entities });
        }

        case 'PREISMELDUNGEN_LOAD_SUCCESS':
            return assign({}, state, { currentPreismeldestelle: action.payload.pms });

        case 'PREISMELDESTELLE_SELECT':
            return assign({}, state, { currentPreismeldestelle: cloneDeep(state.entities[action.payload]) });

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPmsNummers = (state: State) => state.pmsNummers;
export const getCurrentPreismeldestelle = (state: State) => state.currentPreismeldestelle;

export const getAll = createSelector(getEntities, getPmsNummers, (entities, pmsNummers) => pmsNummers.map(x => entities[x]));
