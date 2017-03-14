import * as preiserheber from '../actions/preiserheber';
import { assign, cloneDeep } from 'lodash';
import { createSelector } from 'reselect';
import { Models as P } from 'lik-shared';

export type CurrentPreiserheber = P.Erheber & {
    isModified: boolean;
    isSaved: boolean;
    isCreated: boolean;
    isNew: boolean;
};

export interface State {
    preiserheberIds: string[];
    entities: { [id: string]: P.Erheber };
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
                .map<P.Erheber>(erheber => Object.assign({}, erheber));
            const preiserheberIds = preiserhebers.map(p => p._id);
            const entities = preiserhebers.reduce((entities: { [_id: string]: P.Erheber }, preiserheber: P.Erheber) => {
                return Object.assign(entities, { [preiserheber._id]: preiserheber });
            }, {});
            return assign({}, state, { preiserheberIds, entities, currentPreiserheber: undefined });
        }

        case 'SELECT_PREISERHEBER': {
            const currentPreiserheber = action.payload == null ? null : Object.assign({}, cloneDeep(state.entities[action.payload]), { isModified: false, isSaved: false, isCreated: false });
            return assign({}, state, { currentPreiserheber: currentPreiserheber });
        }

        case 'CREATE_PREISERHEBER': {
            const newPreiserheber: CurrentPreiserheber = {
                _id: '__new',
                _rev: undefined,
                firstName: null,
                surname: null,
                personFunction: null,
                languageCode: null,
                telephone: null,
                email: null,
                isModified: false,
                isSaved: false,
                isCreated: false,
                isNew: true
            };
            return assign({}, state, { currentPreiserheber: newPreiserheber });
        }

        case 'UPDATE_CURRENT_PREISERHEBER': {
            const { payload } = action;

            const valuesFromPayload = {
                _id: payload._id,
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

        case 'ASSIGN_TO_CURRENT_PREISZUWEISUNG':
        case 'UNASSIGN_FROM_CURRENT_PREISZUWEISUNG': {
            const currentPreiserheber = assign({},
                state.currentPreiserheber,
                { isModified: true }
            );
            return Object.assign({}, state, { currentPreiserheber });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPreiserheberIds = (state: State) => state.preiserheberIds;
export const getCurrentPreiserheber = (state: State) => state.currentPreiserheber;

export const getAll = createSelector(getEntities, getPreiserheberIds, (entities, preiserheberIds) => preiserheberIds.map(x => entities[x]));
