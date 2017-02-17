import { Erheber } from '../../../../common/models';
import * as preiserheber from '../actions/preiserheber';
import { assign, cloneDeep } from 'lodash';
import { createSelector } from 'reselect';

export type CurrentPreiserheber = Erheber & {
    isModified: boolean;
    isSaved: boolean;
    isCreated: boolean;
};

export interface State {
    preiserheberIds: string[];
    entities: { [id: string]: Erheber };
    currentPreiserheber: CurrentPreiserheber;
};

const initialState: State = {
    preiserheberIds: [],
    entities: {},
    currentPreiserheber: undefined,
};

export function reducer(state = initialState, action: preiserheber.Actions): State {
    switch (action.type) {
        case 'PREISERHEBER_LOAD_SUCCESS': {
            const { payload } = action;
            const preiserhebers = payload.preiserhebers
                .map<Erheber>(erheber => Object.assign({}, erheber));
            const preiserheberIds = preiserhebers.map(p => p._id);
            const entities = preiserhebers.reduce((entities: { [_id: string]: Erheber }, preiserheber: Erheber) => {
                return Object.assign(entities, { [preiserheber._id]: preiserheber });
            }, {});
            return assign({}, state, { preiserheberIds, entities, currentPreiserheber: undefined });
        }

        case 'SELECT_PREISERHEBER': {
            const currentPreiserheber = action.payload == null ? {} : Object.assign({}, cloneDeep(state.entities[action.payload]), { isModified: false, isSaved: false, isCreated: false });
            return assign({}, state, { currentPreiserheber: currentPreiserheber });
        }

        case 'UPDATE_CURRENT_PREISERHEBER': {
            const { payload } = action;

            const valuesFromPayload = {
                firstName: payload.firstName,
                surname: payload.surname,
                personFunction: payload.personFunction,
                languageCode: payload.languageCode,
                telephone: payload.telephone,
                email: payload.email
            };

            const currentPreiserheber = assign({},
                state.currentPreiserheber,
                valuesFromPayload,
                { isModified: true }
            );

            return Object.assign({}, state, { currentPreiserheber });
        }

        case 'SAVE_PREISERHEBER_SUCCESS': {
            const currentPreiserheber = Object.assign({}, state.currentPreiserheber, action.payload);
            const preiserheberIds = !!state.preiserheberIds.find(x => x === currentPreiserheber._id) ? state.preiserheberIds : [...state.preiserheberIds, currentPreiserheber._id];
            return assign({}, state, { currentPreiserheber, preiserheberIds, entities: assign({}, state.entities, { [currentPreiserheber._id]: currentPreiserheber }) });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPreiserheberIds = (state: State) => state.preiserheberIds;
export const getCurrentPreiserheber = (state: State) => state.currentPreiserheber;

export const getAll = createSelector(getEntities, getPreiserheberIds, (entities, preiserheberIds) => preiserheberIds.map(x => entities[x]));
