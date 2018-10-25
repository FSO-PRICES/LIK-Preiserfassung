/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { createSelector } from 'reselect';
import { Models as P } from 'lik-shared';
import * as preismeldestellen from '../actions/preismeldestellen';
import { assign, cloneDeep, isEqual } from 'lodash';

export type CurrentPreismeldestelle = P.Preismeldestelle & {
    isModified: boolean;
};

export interface State {
    pmsNummers: string[];
    entities: { [pmsNummer: string]: P.Preismeldestelle };
    currentPreismeldestelle: CurrentPreismeldestelle;
}

const initialState: State = {
    pmsNummers: [],
    entities: {},
    currentPreismeldestelle: undefined,
};

export function reducer(state = initialState, action: preismeldestellen.Actions): State {
    switch (action.type) {
        case 'PREISMELDESTELLEN_LOAD_SUCCESS': {
            const pmsNummers = action.payload.map(x => x.pmsNummer);
            const entities = action.payload.reduce(
                (agg: { [pmsNummer: string]: P.Preismeldestelle }, preismeldestelle: P.Preismeldestelle) => {
                    return assign(agg, { [preismeldestelle.pmsNummer]: preismeldestelle });
                },
                {}
            );
            return assign({}, state, { pmsNummers, entities });
        }
        case 'PREISMELDESTELLEN_RESET':
            return assign({}, initialState);

        case 'PREISMELDUNGEN_LOAD_SUCCESS':
            return { ...state, currentPreismeldestelle: { ...action.payload.pms, isModified: false } };

        case 'RESET_SELECTED_PREISMELDESTELLE': {
            return { ...state, currentPreismeldestelle: null };
        }

        case 'PREISMELDESTELLE_SELECT':
            return {
                ...state,
                currentPreismeldestelle: { ...cloneDeep(state.entities[action.payload]), isModified: false },
            };

        case 'UPDATE_CURRENT_PREISMELDESTELLE': {
            const { payload } = action;

            const isKontaktPersonSame = (a, b) =>
                !!a &&
                !!b &&
                a.firstName === b.firstName &&
                a.surname === b.surname &&
                a.personFunction === b.personFunction &&
                a.languageCode === b.languageCode &&
                a.telephone === b.telephone &&
                a.mobile === b.mobile &&
                a.fax === b.fax &&
                a.email === b.email;

            if (
                payload.name === state.currentPreismeldestelle.name &&
                payload.supplement === state.currentPreismeldestelle.supplement &&
                payload.street === state.currentPreismeldestelle.street &&
                payload.supplement === state.currentPreismeldestelle.supplement &&
                payload.postcode === state.currentPreismeldestelle.postcode &&
                payload.town === state.currentPreismeldestelle.town &&
                payload.telephone === state.currentPreismeldestelle.telephone &&
                payload.email === state.currentPreismeldestelle.email &&
                payload.internetLink === state.currentPreismeldestelle.internetLink &&
                payload.languageCode === state.currentPreismeldestelle.languageCode &&
                payload.erhebungsart === state.currentPreismeldestelle.erhebungsart &&
                payload.pmsGeschlossen === state.currentPreismeldestelle.pmsGeschlossen &&
                payload.erhebungsartComment === state.currentPreismeldestelle.erhebungsartComment &&
                payload.zusatzInformationen === state.currentPreismeldestelle.zusatzInformationen &&
                payload.pmsTop === state.currentPreismeldestelle.pmsTop &&
                isKontaktPersonSame(payload.kontaktpersons[0], state.currentPreismeldestelle.kontaktpersons[0]) &&
                isKontaktPersonSame(payload.kontaktpersons[1], state.currentPreismeldestelle.kontaktpersons[1])
            ) {
                return state;
            }

            const valuesFromPayload = {
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
                erhebungsartComment: payload.erhebungsartComment,
                zusatzInformationen: payload.zusatzInformationen,
                pmsTop: payload.pmsTop,
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
                isModified: false,
            });
            const preismeldestelleIds = !!state.pmsNummers.find(x => x === currentPreismeldestelle.pmsNummer)
                ? state.pmsNummers
                : [...state.pmsNummers, currentPreismeldestelle.pmsNummer];
            return assign({}, state, {
                currentPreismeldestelle,
                preismeldestelleIds,
                entities: assign({}, state.entities, { [currentPreismeldestelle.pmsNummer]: currentPreismeldestelle }),
            });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPmsNummers = (state: State) => state.pmsNummers;
export const getCurrentPreismeldestelle = (state: State) => state.currentPreismeldestelle;

export const getAll = createSelector(getEntities, getPmsNummers, (entities, pmsNummers) =>
    pmsNummers.map(x => entities[x])
);
