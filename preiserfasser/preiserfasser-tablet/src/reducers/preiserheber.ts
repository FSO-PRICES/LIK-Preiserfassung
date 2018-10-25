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

import { assign } from 'lodash';

import { Models as P } from 'lik-shared';

import * as preiserheber from '../actions/preiserheber';
import { environment } from '../environments/environment';

export type CurrentPreiserheber = P.Erheber & {
    isModified: boolean;
    isSaved: boolean;
};

export interface State {
    preiserheber: CurrentPreiserheber;
    currentPreiserheber: CurrentPreiserheber;
};

const initialState: State = {
    preiserheber: null,
    currentPreiserheber: null
};

export function reducer(state = initialState, action: preiserheber.Action): State {
    switch (action.type) {
        case 'LOAD_PREISERHEBER_SUCCESS': {
            const preiserheber = assign({}, state.currentPreiserheber, action.payload, { isModified: false });
            return assign({}, state, { preiserheber, currentPreiserheber: preiserheber });
        }

        case 'UPDATE_PREISERHEBER': {
            const { payload } = action;

            const valuesFromPayload = {
                firstName: payload.firstName,
                surname: payload.surname,
                languageCode: payload.languageCode,
                telephone: payload.telephone,
                mobilephone: payload.mobilephone,
                email: payload.email,
                fax: payload.fax,
                webseite: payload.webseite,
                street: payload.street,
                postcode: payload.postcode,
                town: payload.town
            } as P.Erheber;

            const currentPreiserheber = assign({},
                state.preiserheber,
                valuesFromPayload,
                { isModified: true, isSaved: false }
            );

            return Object.assign({}, state, { currentPreiserheber });
        }

        case 'SAVE_PREISERHEBER_SUCCESS': {
            const preiserheber = Object.assign({}, state.preiserheber, action.payload, { isModified: false, isSaved: true });
            return assign({}, state, { preiserheber, currentPreiserheber: preiserheber });
        }

        default:
            return state;
    }
}

export const getPreiserheber = (state: State) => state.preiserheber;
export const getCurrentPreiserheber = (state: State) => state.currentPreiserheber;
