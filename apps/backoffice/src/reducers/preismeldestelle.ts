import { assign, cloneDeep } from 'lodash';
import { createSelector } from 'reselect';

import { Models as P } from '@lik-shared';

import * as preismeldestelleActions from '../actions/preismeldestelle';

export type CurrentPreismeldestelle = P.Preismeldestelle & {
    isModified: boolean;
    isSaved: boolean;
};

export interface State {
    preismeldestelleIds: string[];
    entities: { [id: string]: P.Preismeldestelle };
    currentPreismeldestelle: CurrentPreismeldestelle;
    erhebungsregionen: string[];
}

const initialState: State = {
    preismeldestelleIds: [],
    entities: {},
    currentPreismeldestelle: undefined,
    erhebungsregionen: [],
};

export function reducer(state = initialState, action: preismeldestelleActions.Action): State {
    switch (action.type) {
        case 'PREISMELDESTELLE_LOAD_SUCCESS': {
            const { payload } = action;
            const erhebungsregionen = [];
            const preismeldestellen = payload.map<P.Preismeldestelle>(preismeldestelle => {
                if (erhebungsregionen.indexOf(preismeldestelle.erhebungsregion) === -1) {
                    erhebungsregionen.push(preismeldestelle.erhebungsregion);
                }
                return Object.assign({}, preismeldestelle);
            });
            const preismeldestelleIds = preismeldestellen.map(p => p._id);
            const entities = preismeldestellen.reduce(
                (agg: { [_id: string]: P.Preismeldestelle }, preismeldestelle: P.Preismeldestelle) => {
                    return assign(agg, { [preismeldestelle._id]: preismeldestelle });
                },
                {},
            );
            return assign({}, state, {
                preismeldestelleIds,
                entities,
                currentPreismeldestelle: undefined,
                erhebungsregionen,
            });
        }

        case 'SELECT_PREISMELDESTELLE': {
            const currentPreismeldestelle =
                action.payload == null
                    ? null
                    : { ...cloneDeep(state.entities[action.payload]), isModified: false, isSaved: false };
            return { ...state, currentPreismeldestelle };
        }

        case 'UPDATE_CURRENT_PREISMELDESTELLE': {
            const { payload } = action;

            const isEqual = (a, b) => a === b || (!a && !b);
            const isKontaktPersonSame = (a, b) =>
                !!a &&
                !!b &&
                isEqual(a.firstName, b.firstName) &&
                isEqual(a.surname, b.surname) &&
                isEqual(a.personFunction, b.personFunction) &&
                isEqual(a.languageCode, b.languageCode) &&
                isEqual(a.telephone, b.telephone) &&
                isEqual(a.mobile, b.mobile) &&
                isEqual(a.fax, b.fax) &&
                isEqual(a.email, b.email);

            if (
                isEqual(payload.name, state.currentPreismeldestelle.name) &&
                isEqual(payload.supplement, state.currentPreismeldestelle.supplement) &&
                isEqual(payload.street, state.currentPreismeldestelle.street) &&
                isEqual(payload.supplement, state.currentPreismeldestelle.supplement) &&
                isEqual(payload.postcode, state.currentPreismeldestelle.postcode) &&
                isEqual(payload.town, state.currentPreismeldestelle.town) &&
                isEqual(payload.telephone, state.currentPreismeldestelle.telephone) &&
                isEqual(payload.email, state.currentPreismeldestelle.email) &&
                isEqual(payload.internetLink, state.currentPreismeldestelle.internetLink) &&
                isEqual(payload.languageCode, state.currentPreismeldestelle.languageCode) &&
                isEqual(payload.erhebungsart, state.currentPreismeldestelle.erhebungsart) &&
                isEqual(payload.pmsGeschlossen, state.currentPreismeldestelle.pmsGeschlossen) &&
                isEqual(payload.erhebungsregion, state.currentPreismeldestelle.erhebungsregion) &&
                isEqual(payload.erhebungsartComment, state.currentPreismeldestelle.erhebungsartComment) &&
                isEqual(payload.zusatzInformationen, state.currentPreismeldestelle.zusatzInformationen) &&
                isKontaktPersonSame(payload.kontaktpersons[0], state.currentPreismeldestelle.kontaktpersons[0]) &&
                isKontaktPersonSame(payload.kontaktpersons[1], state.currentPreismeldestelle.kontaktpersons[1])
            ) {
                return state;
            }

            const valuesFromPayload = {
                _id: payload._id,
                name: payload.name,
                supplement: payload.supplement,
                street: payload.street,
                postcode: payload.postcode,
                town: payload.town,
                telephone: payload.telephone,
                email: payload.email,
                internetLink: payload.internetLink,
                languageCode: payload.languageCode,
                erhebungsart: payload.erhebungsart,
                pmsGeschlossen: payload.pmsGeschlossen,
                erhebungsregion: payload.erhebungsregion,
                erhebungsartComment: payload.erhebungsartComment,
                zusatzInformationen: payload.zusatzInformationen,
                kontaktpersons: cloneDeep(payload.kontaktpersons),
            };

            const currentPreismeldestelle = {
                ...state.currentPreismeldestelle,
                ...valuesFromPayload,
                isModified: true,
            };

            return { ...state, currentPreismeldestelle };
        }

        case 'SAVE_PREISMELDESTELLE_SUCCESS': {
            const currentPreismeldestelle = Object.assign({}, state.currentPreismeldestelle, action.payload, {
                isSaved: true,
                isModified: false,
            });
            const preismeldestelleIds = !!state.preismeldestelleIds.find(x => x === currentPreismeldestelle._id)
                ? state.preismeldestelleIds
                : [...state.preismeldestelleIds, currentPreismeldestelle._id];
            return assign({}, state, {
                currentPreismeldestelle,
                preismeldestelleIds,
                entities: assign({}, state.entities, { [currentPreismeldestelle._id]: currentPreismeldestelle }),
            });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPreismeldestelleIds = (state: State) => state.preismeldestelleIds;
export const getCurrentPreismeldestelle = (state: State) => state.currentPreismeldestelle;
export const getErhebungsregionen = (state: State) => state.erhebungsregionen;

export const getAll = createSelector(
    getEntities,
    getPreismeldestelleIds,
    (entities, preismeldestelleIds) => preismeldestelleIds.map(x => entities[x]),
);
