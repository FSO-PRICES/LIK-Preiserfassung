import { Models as P } from 'lik-shared';

import * as preismeldestelle from '../actions/preismeldestelle';
import { assign, cloneDeep } from 'lodash';
import { createSelector } from 'reselect';

export type CurrentPreismeldestelle = P.AdvancedPreismeldestelle & {
    isModified: boolean;
    isSaved: boolean;
};

export interface State {
    preismeldestelleIds: string[];
    entities: { [id: string]: P.AdvancedPreismeldestelle };
    currentPreismeldestelle: CurrentPreismeldestelle;
};

const initialState: State = {
    preismeldestelleIds: [],
    entities: {},
    currentPreismeldestelle: undefined,
};

export function reducer(state = initialState, action: preismeldestelle.Actions): State {
    switch (action.type) {
        case 'PREISMELDESTELLE_LOAD_SUCCESS': {
            const { payload } = action;
            const preismeldestellen = payload.preismeldestellen
                .map<P.AdvancedPreismeldestelle>(preismeldestelle => Object.assign({}, preismeldestelle));
            const preismeldestelleIds = preismeldestellen.map(p => p._id);
            const entities = preismeldestellen.reduce((entities: { [_id: string]: P.AdvancedPreismeldestelle }, preismeldestelle: P.AdvancedPreismeldestelle) => {
                return Object.assign(entities, { [preismeldestelle._id]: preismeldestelle });
            }, {});
            return assign({}, state, { preismeldestelleIds, entities, currentPreismeldestelle: undefined });
        }

        case 'SELECT_PREISMELDESTELLE': {
            const currentPreismeldestelle = action.payload == null ? null : Object.assign({}, cloneDeep(state.entities[action.payload]), { isModified: false });
            return assign({}, state, { currentPreismeldestelle: currentPreismeldestelle });
        }

        case 'CREATE_PREISMELDESTELLE': {
            const newPreismeldestelle: CurrentPreismeldestelle = {
                _id: (+ new Date()).toString(),
                _rev: undefined,
                pmsNummer: null,
                name: null,
                supplement: null,
                email: null,
                street: null,
                postcode: null,
                town: null,
                regionId: null,
                erhebungsart: null,
                erhebungshaeufigkeit: null,
                erhebungsartComment: null,
                kontaktpersons: null,
                languageCode: null,
                telephone: null,
                active: true,
                isModified: false,
                isSaved: false
            };
            return assign({}, state, { currentPreismeldestelle: newPreismeldestelle });
        }

        case 'UPDATE_CURRENT_PREISMELDESTELLE': {
            const { payload } = action;

            const valuesFromPayload = {
                pmsNummer: payload.pmsNummer,
                name: payload.name,
                supplement: payload.supplement,
                street: payload.street,
                postcode: payload.postcode,
                town: payload.town,
                regionId: payload.regionId,
                erhebungsart: payload.erhebungsart,
                erhebungshaeufigkeit: payload.erhebungshaeufigkeit,
                erhebungsartComment: payload.erhebungsartComment,
                kontaktpersons: payload.kontaktpersons, // TODO: Nested values, how to handle?
                languageCode: payload.languageCode,
                telephone: payload.telephone,
                email: payload.email,
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
            const currentPreismeldestelle = Object.assign({}, state.currentPreismeldestelle, action.payload);
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
