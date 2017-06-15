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
                personFunction: payload.personFunction,
                languageCode: payload.languageCode,
                telephone: payload.telephone,
                mobilephone: payload.mobilephone,
                email: payload.email,
                fax: payload.fax,
                webseite: payload.webseite,
                street: payload.street,
                postcode: payload.postcode,
                town: payload.town
            };

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
