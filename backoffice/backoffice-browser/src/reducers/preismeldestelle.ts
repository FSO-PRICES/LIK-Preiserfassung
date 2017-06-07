import { Models as P } from 'lik-shared';

import * as preismeldestelle from '../actions/preismeldestelle';
import { assign, cloneDeep } from 'lodash';
import { createSelector } from 'reselect';

export type CurrentPreismeldestelle = P.Preismeldestelle & {
    isModified: boolean;
    isSaved: boolean;
};

export interface State {
    preismeldestelleIds: string[];
    entities: { [id: string]: P.Preismeldestelle };
    currentPreismeldestelle: CurrentPreismeldestelle;
};

const initialState: State = {
    preismeldestelleIds: [],
    entities: {},
    currentPreismeldestelle: undefined,
};

export function reducer(state = initialState, action: preismeldestelle.Action): State {
    switch (action.type) {
        case 'PREISMELDESTELLE_LOAD_SUCCESS': {
            const { payload } = action;
            const preismeldestellen = payload
                .map<P.Preismeldestelle>(preismeldestelle => Object.assign({}, preismeldestelle));
            const preismeldestelleIds = preismeldestellen.map(p => p._id);
            const entities = preismeldestellen.reduce((agg: { [_id: string]: P.Preismeldestelle }, preismeldestelle: P.Preismeldestelle) => {
                return assign(agg, { [preismeldestelle._id]: preismeldestelle });
            }, {});
            return assign({}, state, { preismeldestelleIds, entities, currentPreismeldestelle: undefined });
        }

        case 'SELECT_PREISMELDESTELLE': {
            const currentPreismeldestelle = action.payload == null ? null : Object.assign({}, cloneDeep(state.entities[action.payload]), { isModified: false });
            return assign({}, state, { currentPreismeldestelle: currentPreismeldestelle });
        }

        case 'UPDATE_CURRENT_PREISMELDESTELLE': {
            const { payload } = action;

            const valuesFromPayload = {
                _id: payload._id,
                name: payload.name,
                supplement: payload.supplement,
                street: payload.street,
                postcode: payload.postcode,
                town: payload.town,
                telephone: payload.telephone,
                email: payload.email,
                languageCode: payload.languageCode,
                erhebungsart: payload.erhebungsart,
                pmsGeschlossen: payload.pmsGeschlossen,
                erhebungsartComment: payload.erhebungsartComment,
                zusatzInformationen: payload.zusatzInformationen,
                kontaktpersons: cloneDeep(payload.kontaktpersons),
                active: payload.active
            };

            const currentPreismeldestelle = assign({},
                state.currentPreismeldestelle,
                valuesFromPayload,
                { isModified: true }
            );

            return Object.assign({}, state, { currentPreismeldestelle });
        }

        case 'SAVE_PREISMELDESTELLE_SUCCESS': {
            const currentPreismeldestelle = Object.assign({}, state.currentPreismeldestelle, action.payload, { isSaved: true, isModified: false });
            const preismeldestelleIds = !!state.preismeldestelleIds.find(x => x === currentPreismeldestelle._id) ? state.preismeldestelleIds : [...state.preismeldestelleIds, currentPreismeldestelle._id];
            return assign({}, state, { currentPreismeldestelle, preismeldestelleIds, entities: assign({}, state.entities, { [currentPreismeldestelle._id]: currentPreismeldestelle }) });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPreismeldestelleIds = (state: State) => state.preismeldestelleIds;
export const getCurrentPreismeldestelle = (state: State) => state.currentPreismeldestelle;

export const getAll = createSelector(getEntities, getPreismeldestelleIds, (entities, preismeldestelleIds) => preismeldestelleIds.map(x => entities[x]));
