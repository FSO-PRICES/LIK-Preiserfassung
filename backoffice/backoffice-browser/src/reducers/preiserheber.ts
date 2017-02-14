import { Erheber } from '../../../../common/models';
import * as preiserheber from '../actions/preiserheber';
import { merge } from 'lodash';
import { createSelector } from 'reselect';

export interface State {
    preiserheberIds: string[];
    entities: { [id: string]: Erheber };
    currentPreiserheber: Erheber;
};

const initialState: State = {
    preiserheberIds: [],
    entities: {},
    currentPreiserheber: undefined,
};

export function reducer(state = initialState, action: preiserheber.Actions): State {
    switch (action.type) {
        case "PREISERHEBER_LOAD_SUCCESS": {
            const { payload } = action;
            const preiserhebers = payload.preiserhebers;
            const preiserheberIds = preiserhebers.map(p => p._id)
            const entities = preiserhebers.reduce((entities: { [_id: string]: Erheber }, preiserheber: Erheber) => {
                return Object.assign(entities, { [preiserheber._id]: preiserheber });
            }, {});
            return merge({}, state, { preiserheberIds, entities, currentPreiserheber: undefined });
        }

        case 'SAVE_PREISMELDUNG_PRICE_SUCCESS': {
            const currentPreismeldung = Object.assign({}, state.currentPreiserheber, { preismeldung: action.payload.preiserheber }, { isModified: false, isSaved: true });
            return merge({}, state, { currentPreismeldung: currentPreismeldung, entities: Object.assign({}, state.entities, { [currentPreismeldung._id]: currentPreismeldung }) });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getPreiserheberIds = (state: State) => state.preiserheberIds;
export const getCurrentPreiserheber = (state: State) => state.currentPreiserheber;

export const getAll = createSelector(getEntities, getPreiserheberIds, (entities, preismeldungIds) => preismeldungIds.map(x => entities[x]));
