import { assign, cloneDeep } from 'lodash';
import { createSelector } from 'reselect';

import { Models as P } from '@lik-shared';

import * as preiserheber from '../actions/preiserheber';

export type CurrentPreiserheber = P.Erheber & {
    isModified: boolean;
    isSaved: boolean;
    isNew: boolean;
    error?: string;
    isPasswordResetted?: boolean;
};

export interface State {
    preiserheberIds: string[];
    entities: { [id: string]: P.Erheber };
    currentPreiserheber: CurrentPreiserheber;
}

const initialState: State = {
    preiserheberIds: [],
    entities: {},
    currentPreiserheber: undefined,
};

export function reducer(state = initialState, action: preiserheber.Action): State {
    switch (action.type) {
        case 'PREISERHEBER_LOAD_SUCCESS': {
            const { payload } = action;
            const preiserhebers = payload.map<P.Erheber>(erheber => Object.assign({}, erheber));
            const preiserheberIds = preiserhebers.map(p => p._id);
            const entities = preiserhebers.reduce((agg: { [_id: string]: P.Erheber }, preiserheberValue: P.Erheber) => {
                return Object.assign(agg, { [preiserheberValue._id]: preiserheberValue });
            }, {});
            return assign({}, state, { preiserheberIds, entities, currentPreiserheber: undefined });
        }

        case 'SELECT_PREISERHEBER': {
            const currentPreiserheber =
                action.payload == null
                    ? null
                    : { ...cloneDeep(state.entities[action.payload]), isModified: false, isSaved: false, isNew: false };
            return { ...state, currentPreiserheber: currentPreiserheber };
        }

        case 'RESET_PASSWORD_SUCCESS': {
            const currentPreiserheber = { ...state.currentPreiserheber, isPasswordResetted: true };
            return { ...state, currentPreiserheber };
        }

        case 'CLEAR_RESET_PASSWORD_STATE': {
            const currentPreiserheber = { ...state.currentPreiserheber, isPasswordResetted: null };
            return { ...state, currentPreiserheber };
        }

        case 'DELETE_PREISERHEBER_SUCCESS': {
            const entities = Object.assign({}, state.entities);
            if (state.preiserheberIds.some(pId => pId === action.payload)) {
                const preiserheberIds = state.preiserheberIds.filter(pId => pId !== action.payload);
                delete entities[action.payload];
                return assign({}, state, { currentPreiserheber: undefined, entities, preiserheberIds });
            }
            return state;
        }

        case 'CREATE_PREISERHEBER': {
            const newPreiserheber: CurrentPreiserheber = {
                _id: null,
                _rev: undefined,
                peNummer: null,
                username: null,
                firstName: null,
                surname: null,
                erhebungsregion: null,
                languageCode: null,
                telephone: null,
                mobilephone: null,
                email: null,
                fax: null,
                webseite: null,
                street: null,
                postcode: null,
                town: null,
                isModified: false,
                isSaved: false,
                isNew: true,
            };
            return { ...state, currentPreiserheber: newPreiserheber };
        }

        case 'UPDATE_CURRENT_PREISERHEBER': {
            const { payload } = action;

            const isEqual = (a, b) => a === b || (!a && !b);

            if (
                isEqual(payload.peNummer, state.currentPreiserheber.peNummer) &&
                isEqual(payload.username, state.currentPreiserheber.username) &&
                isEqual(payload.firstName, state.currentPreiserheber.firstName) &&
                isEqual(payload.surname, state.currentPreiserheber.surname) &&
                isEqual(payload.erhebungsregion, state.currentPreiserheber.erhebungsregion) &&
                isEqual(payload.languageCode, state.currentPreiserheber.languageCode) &&
                isEqual(payload.telephone, state.currentPreiserheber.telephone) &&
                isEqual(payload.mobilephone, state.currentPreiserheber.mobilephone) &&
                isEqual(payload.email, state.currentPreiserheber.email) &&
                isEqual(payload.fax, state.currentPreiserheber.fax) &&
                isEqual(payload.webseite, state.currentPreiserheber.webseite) &&
                isEqual(payload.street, state.currentPreiserheber.street) &&
                isEqual(payload.postcode, state.currentPreiserheber.postcode) &&
                isEqual(payload.town, state.currentPreiserheber.town) &&
                isEqual(payload.town, state.currentPreiserheber.town)
            ) {
                return state;
            }

            const valuesFromPayload = {
                _id: payload._id,
                peNummer: payload.peNummer,
                username: payload.username,
                firstName: payload.firstName,
                surname: payload.surname,
                erhebungsregion: payload.erhebungsregion,
                languageCode: payload.languageCode,
                telephone: payload.telephone,
                mobilephone: payload.mobilephone,
                email: payload.email,
                fax: payload.fax,
                webseite: payload.webseite,
                street: payload.street,
                postcode: payload.postcode,
                town: payload.town,
            } as P.Erheber;

            const currentPreiserheber = { ...state.currentPreiserheber, ...valuesFromPayload, isModified: true };

            return { ...state, currentPreiserheber };
        }

        case 'SAVE_PREISERHEBER_SUCCESS': {
            const currentPreiserheber = Object.assign({}, state.currentPreiserheber, action.payload, {
                isNew: false,
                isModified: false,
                isSaved: true,
                error: null,
            });
            const preiserheberIds = !!state.preiserheberIds.find(x => x === currentPreiserheber._id)
                ? state.preiserheberIds
                : [...state.preiserheberIds, currentPreiserheber._id];
            return assign({}, state, {
                currentPreiserheber,
                preiserheberIds,
                entities: assign({}, state.entities, { [currentPreiserheber._id]: currentPreiserheber }),
            });
        }

        case 'SAVE_PREISERHEBER_FAILURE': {
            const currentPreiserheber = Object.assign({}, state.currentPreiserheber, { error: action.payload });
            return assign({}, state, { currentPreiserheber });
        }

        case 'ASSIGN_TO_CURRENT_PREISZUWEISUNG':
        case 'UNASSIGN_FROM_CURRENT_PREISZUWEISUNG': {
            const currentPreiserheber = assign({}, state.currentPreiserheber, { isModified: true });
            return Object.assign({}, state, { currentPreiserheber });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPreiserheberIds = (state: State) => state.preiserheberIds;
export const getCurrentPreiserheber = (state: State) => state.currentPreiserheber;

export const getAll = createSelector(
    getEntities,
    getPreiserheberIds,
    (entities, preiserheberIds) => preiserheberIds.map(x => entities[x]),
);
