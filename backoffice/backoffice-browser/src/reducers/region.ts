import { Models as P } from 'lik-shared';

import * as region from '../actions/region';
import { assign, cloneDeep } from 'lodash';
import { createSelector } from 'reselect';

export type CurrentRegion = P.Region & {
    isModified: boolean;
    isSaved: boolean;
};

export interface State {
    regionIds: string[];
    entities: { [id: string]: P.Region };
    currentRegion: CurrentRegion;
};

const initialState: State = {
    regionIds: [],
    entities: {},
    currentRegion: undefined,
};

export function reducer(state = initialState, action: region.Actions): State {
    switch (action.type) {
        case 'REGION_LOAD_SUCCESS': {
            const { payload } = action;
            const regionn = payload.regionen
                .map<P.Region>(region => Object.assign({}, region));
            const regionIds = regionn.map(p => p._id);
            const entities = regionn.reduce((entities: { [_id: string]: P.Region }, region: P.Region) => {
                return Object.assign(entities, { [region._id]: region });
            }, {});
            return assign({}, state, { regionIds, entities, currentRegion: undefined });
        }

        case 'SELECT_REGION': {
            const currentRegion = action.payload == null ? null : Object.assign({}, cloneDeep(state.entities[action.payload]), { isModified: false });
            return assign({}, state, { currentRegion: currentRegion });
        }

        case 'CREATE_REGION': {
            const newRegion: CurrentRegion = createNewRegion();
            return assign({}, state, { currentRegion: newRegion });
        }

        case 'UPDATE_CURRENT_REGION': {
            const { payload } = action;

            const valuesFromPayload = {
                name: payload.name
            };

            const currentRegion = assign({},
                state.currentRegion,
                valuesFromPayload,
                { isModified: true }
            );

            return Object.assign({}, state, { currentRegion });
        }

        case 'SAVE_REGION_SUCCESS': {
            const { createNew, region } = action.payload;
            const currentRegion = Object.assign({}, state.currentRegion, region);
            const regionIds = !!state.regionIds.find(x => x === currentRegion._id) ? state.regionIds : [...state.regionIds, currentRegion._id];
            return assign({}, state, { currentRegion: createNew ? createNewRegion() : currentRegion, regionIds, entities: assign({}, state.entities, { [currentRegion._id]: currentRegion }) });
        }

        default:
            return state;
    }
}

export const getEntities = (state: State) => state.entities;
export const getRegionIds = (state: State) => state.regionIds;
export const getCurrentRegion = (state: State) => state.currentRegion;

export const getAll = createSelector(getEntities, getRegionIds, (entities, regionIds) => regionIds.map(x => entities[x]));

function createNewRegion(): CurrentRegion {
    return {
        _id: (+ new Date()).toString(),
        _rev: undefined,
        name: null,
        isModified: false,
        isSaved: false
    }
}
