import { Models as P } from 'lik-shared';

import * as preismeldung from '../actions/preismeldung';
import { assign } from 'lodash';
import { createSelector } from 'reselect';

export interface State {
    preismeldungIds: string[];
    entities: { [id: string]: P.CompletePreismeldung };
    isLoaded: boolean;
};

const initialState: State = {
    preismeldungIds: [],
    entities: {},
    isLoaded: false
};

export function reducer(state = initialState, action: preismeldung.Actions): State {
    switch (action.type) {
        case 'PREISMELDUNG_LOAD': {
            return assign({}, state, { isLoaded: false });
        }

        case 'PREISMELDUNG_LOAD_SUCCESS': {
            const { payload } = action;
            const preismeldungn = payload.preismeldungen
                .map<P.CompletePreismeldung>(preismeldung => Object.assign({}, preismeldung));
            const preismeldungIds = preismeldungn.map(p => p._id);
            const entities = preismeldungn.reduce((entities: { [_id: string]: P.CompletePreismeldung }, preismeldung: P.CompletePreismeldung) => {
                return Object.assign(entities, { [preismeldung._id]: preismeldung });
            }, {});
            return assign({}, state, { preismeldungIds, entities, isLoaded: true });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPreismeldungIds = (state: State) => state.preismeldungIds;
export const getIsLoaded = (state: State) => state.isLoaded;

export const getAll = createSelector(getEntities, getPreismeldungIds, (entities, preismeldungIds) => preismeldungIds.map(x => entities[x]));
