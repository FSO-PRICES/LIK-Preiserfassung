import { Action } from '../actions/preiszuweisung';
import { assign, remove, cloneDeep } from 'lodash';
import { createSelector } from 'reselect';
import { Models as P } from 'lik-shared';

export type CurrentPreiszuweisung = P.Preiszuweisung & {
    isModified: boolean;
    isNew: boolean;
    isSaved: boolean;
};

export interface State {
    preiszuweisungIds: string[];
    entities: { [id: string]: P.Preiszuweisung };
    currentPreiszuweisung: CurrentPreiszuweisung;
};

const initialState: State = {
    preiszuweisungIds: [],
    entities: {},
    currentPreiszuweisung: undefined,
};

export function reducer(state = initialState, action: Action): State {
    switch (action.type) {
        case 'PREISZUWEISUNG_LOAD_SUCCESS': {
            const { payload } = action;
            const preiszuweisungen = payload.map<P.Preiszuweisung>(preiszuweisung => Object.assign({}, preiszuweisung));
            const preiszuweisungIds = preiszuweisungen.map(p => p._id);
            const entities = preiszuweisungen.reduce((agg: { [_id: string]: P.Preiszuweisung }, preiszuweisung: P.Preiszuweisung) => {
                return Object.assign(agg, { [preiszuweisung._id]: preiszuweisung });
            }, {});
            return assign({}, state, { preiszuweisungIds, entities, currentPreiszuweisung: undefined });
        }

        case 'SELECT_OR_CREATE_PREISZUWEISUNG': {
            const { payload: preiserheberId } = action;
            const newPreiszuweisung = {
                _id: (+ new Date()).toString(),
                _rev: undefined,
                isNew: true,
                isModified: false,
                isSaved: false,
                preiserheberId: preiserheberId,
                preismeldestellenNummern: []
            };
            const currentPreiszuweisung: CurrentPreiszuweisung = preiserheberId == null || !state.entities[preiserheberId] ? newPreiszuweisung : Object.assign({}, cloneDeep(state.entities[preiserheberId]), { isModified: false, isNew: false, isSaved: false });

            return assign({}, state, { currentPreiszuweisung: currentPreiszuweisung });
        }

        case 'CREATE_PREISZUWEISUNG': {
            const newPreiszuweisung = <CurrentPreiszuweisung>{
                _id: (+ new Date()).toString(),
                _rev: undefined,
                isNew: true,
                isModified: false,
                isSaved: false,
                preiserheberId: null,
                preismeldestellenNummern: []
            };
            return assign({}, state, { currentPreiszuweisung: newPreiszuweisung });
        }

        case 'UPDATE_CURRENT_PREISZUWEISUNG': {
            const { payload } = action;

            const valuesFromPayload = {
                _id: payload._id,
                preiserheberId: payload.preiserheberId,
                preismeldestellen: payload.preismeldestellenNummern
            };

            const currentPreiszuweisung = assign({},
                state.currentPreiszuweisung,
                valuesFromPayload,
                { isModified: true }
            );

            return Object.assign({}, state, { currentPreiszuweisung });
        }

        case 'ASSIGN_TO_CURRENT_PREISZUWEISUNG': {
            const { payload } = action;
            const currentPreiszuweisung = Object.assign({}, cloneDeep(state.currentPreiszuweisung), { isModified: true });
            currentPreiszuweisung.preismeldestellenNummern.push(payload.pmsNummer);
            return assign({}, state, { currentPreiszuweisung });
        }

        case 'UNASSIGN_FROM_CURRENT_PREISZUWEISUNG': {
            const { payload } = action;
            const currentPreiszuweisung = Object.assign({}, cloneDeep(state.currentPreiszuweisung), { isModified: true });
            remove(currentPreiszuweisung.preismeldestellenNummern, pmsNummer => pmsNummer === payload.pmsNummer);
            return assign({}, state, { currentPreiszuweisung });
        }

        case 'SAVE_PREISZUWEISUNG_SUCCESS': {
            const currentPreiszuweisung = Object.assign({}, state.currentPreiszuweisung, action.payload, { isModified: false, isSaved: true });
            const preiszuweisungIds = !!state.preiszuweisungIds.find(x => x === currentPreiszuweisung._id) ? state.preiszuweisungIds : [...state.preiszuweisungIds, currentPreiszuweisung._id];
            return assign({}, state, { currentPreiszuweisung, preiszuweisungIds, entities: assign({}, state.entities, { [currentPreiszuweisung._id]: currentPreiszuweisung }) });
        }

        case 'DELETE_PREISZUWEISUNG_SUCCESS': {
            const currentPreiszuweisungId = state.currentPreiszuweisung._id;
            const preiszuweisungIds = state.preiszuweisungIds.slice();
            const entities = Object.assign({}, state.entities);
            remove(preiszuweisungIds, id => id === currentPreiszuweisungId);
            delete entities[currentPreiszuweisungId];

            return assign({}, state, { currentPreiszuweisung: undefined, preiszuweisungIds, entities });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPreiszuweisungIds = (state: State) => state.preiszuweisungIds;
export const getCurrentPreiszuweisung = (state: State) => state.currentPreiszuweisung;

export const getAll = createSelector(getEntities, getPreiszuweisungIds, (entities, preiszuweisungIds) => preiszuweisungIds.map(x => entities[x]));
